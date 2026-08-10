import prisma from '../config/prisma';
import { CreateChallanInput, UpdateChallanInput, ChallanQuery } from '../validators/challan.validator';

// ─── Typed Errors ─────────────────────────────────────────────────────────────

export class ChallanNotFoundError extends Error {
  constructor() { super('Challan not found'); this.name = 'ChallanNotFoundError'; }
}

export class InvalidStatusTransitionError extends Error {
  constructor(from: string, to: string) {
    super(`Cannot transition challan from ${from} to ${to}`);
    this.name = 'InvalidStatusTransitionError';
  }
}

export class InsufficientStockError extends Error {
  constructor(
    public productName: string,
    public available: number,
    public requested: number,
  ) {
    super('Insufficient stock');
    this.name = 'InsufficientStockError';
  }
}

// ─── Challan Number Generation ────────────────────────────────────────────────
// Finds the highest existing challan number and increments it.
// Runs inside the same transaction as challan creation so two concurrent
// requests cannot generate the same number — the unique constraint on
// challanNumber is the final safety net.
async function generateChallanNumber(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]
): Promise<string> {
  const last = await tx.challan.findFirst({
    orderBy: { challanNumber: 'desc' },
    select: { challanNumber: true },
  });

  if (!last) return 'CH-0001';

  // Extract the numeric part after "CH-"
  const num = parseInt(last.challanNumber.replace('CH-', ''), 10);
  return `CH-${String(num + 1).padStart(4, '0')}`;
}

// ─── List Challans ────────────────────────────────────────────────────────────
export async function listChallans(query: ChallanQuery) {
  const { page, limit, search, status, customerId } = query;
  const skip = (page - 1) * limit;

  const where = {
    ...(status && { status }),
    ...(customerId && { customerId }),
    ...(search && {
      challanNumber: { contains: search, mode: 'insensitive' as const },
    }),
  };

  const [challans, total] = await Promise.all([
    prisma.challan.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, customerName: true, businessName: true } },
        createdBy: { select: { id: true, name: true } },
        _count: { select: { items: true } },
      },
    }),
    prisma.challan.count({ where }),
  ]);

  return {
    challans,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

// ─── Get Single Challan ───────────────────────────────────────────────────────
export async function getChallanById(id: string) {
  const challan = await prisma.challan.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, customerName: true, businessName: true, mobile: true } },
      createdBy: { select: { id: true, name: true } },
      items: {
        orderBy: { createdAt: 'asc' },
        include: {
          product: { select: { id: true, currentStock: true } },
        },
      },
    },
  });

  if (!challan) throw new ChallanNotFoundError();

  return {
    ...challan,
    items: challan.items.map((item) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
    })),
  };
}

// ─── Create Draft Challan ─────────────────────────────────────────────────────
// IMPORTANT: Creating a draft does NOT touch stock at all.
export async function createChallan(data: CreateChallanInput, userId: string) {
  return prisma.$transaction(async (tx) => {
    // Validate customer
    const customer = await tx.customer.findUnique({ where: { id: data.customerId } });
    if (!customer) throw new Error('Customer not found');

    // Validate all products exist and fetch their current data for the snapshot
    const productIds = data.items.map((i) => i.productId);
    const products = await tx.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== productIds.length) {
      const foundIds = new Set(products.map((p) => p.id));
      const missing = productIds.find((id) => !foundIds.has(id));
      throw new Error(`Product not found: ${missing}`);
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Generate challan number inside the transaction
    const challanNumber = await generateChallanNumber(tx);

    const totalQuantity = data.items.reduce((sum, i) => sum + i.quantity, 0);

    const challan = await tx.challan.create({
      data: {
        challanNumber,
        customerId: data.customerId,
        totalQuantity,
        status: 'DRAFT',
        createdById: userId,
        items: {
          create: data.items.map((item) => {
            const product = productMap.get(item.productId)!;
            return {
              productId: item.productId,
              // ── Snapshot fields ──────────────────────────────────────────
              // We copy name, SKU, and price from the product AS IT EXISTS NOW.
              // If the product is edited tomorrow, this challan still shows
              // the price that was valid when the challan was created.
              productName: product.name,
              sku: product.sku,
              unitPrice: product.unitPrice,
              quantity: item.quantity,
            };
          }),
        },
      },
      include: {
        customer: { select: { id: true, customerName: true, businessName: true } },
        createdBy: { select: { id: true, name: true } },
        items: true,
      },
    });

    return {
      ...challan,
      items: challan.items.map((item) => ({ ...item, unitPrice: Number(item.unitPrice) })),
    };
  });
}

// ─── Update Draft Challan ─────────────────────────────────────────────────────
// Only DRAFT challans can be edited. Replaces all items.
export async function updateChallan(id: string, data: UpdateChallanInput) {
  return prisma.$transaction(async (tx) => {
    const challan = await tx.challan.findUnique({ where: { id } });
    if (!challan) throw new ChallanNotFoundError();
    if (challan.status !== 'DRAFT') {
      throw new InvalidStatusTransitionError(challan.status, 'DRAFT (edit)');
    }

    // If items are being replaced, delete old ones and re-create
    if (data.items) {
      const productIds = data.items.map((i) => i.productId);
      const products = await tx.product.findMany({ where: { id: { in: productIds } } });

      if (products.length !== productIds.length) {
        throw new Error('One or more products not found');
      }

      const productMap = new Map(products.map((p) => [p.id, p]));
      const totalQuantity = data.items.reduce((sum, i) => sum + i.quantity, 0);

      await tx.challanItem.deleteMany({ where: { challanId: id } });

      await tx.challan.update({
        where: { id },
        data: {
          totalQuantity,
          ...(data.customerId && { customerId: data.customerId }),
          items: {
            create: data.items.map((item) => {
              const product = productMap.get(item.productId)!;
              return {
                productId: item.productId,
                productName: product.name,
                sku: product.sku,
                unitPrice: product.unitPrice,
                quantity: item.quantity,
              };
            }),
          },
        },
      });
    } else if (data.customerId) {
      await tx.challan.update({ where: { id }, data: { customerId: data.customerId } });
    }

    return getChallanById(id);
  });
}

// ─── Confirm Challan ──────────────────────────────────────────────────────────
// THE MOST CRITICAL OPERATION.
//
// Inside a single transaction:
//   1. Lock every product row involved (SELECT FOR UPDATE)
//   2. Check ALL products have sufficient stock
//   3. If ANY product fails → throw → entire transaction rolls back
//   4. Deduct stock for every product
//   5. Create OUT stock movement for every product
//   6. Mark challan CONFIRMED
//   7. COMMIT
//
// If anything fails at any step, PostgreSQL rolls back everything.
// No partial stock deductions. No orphaned movements. No inconsistent state.
export async function confirmChallan(id: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    // Step 1: Load challan with items
    const challan = await tx.challan.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!challan) throw new ChallanNotFoundError();

    // Step 2: Validate status transition — only DRAFT → CONFIRMED is allowed
    if (challan.status !== 'DRAFT') {
      throw new InvalidStatusTransitionError(challan.status, 'CONFIRMED');
    }

    if (challan.items.length === 0) {
      throw new Error('Cannot confirm a challan with no items');
    }

    const productIds = challan.items.map((item) => item.productId);

    // Step 3: Lock all product rows involved in this challan.
    // SELECT FOR UPDATE acquires a row-level exclusive lock.
    // Any other transaction trying to modify these rows will WAIT
    // until this transaction commits or rolls back.
    // This prevents two simultaneous confirmations from both passing
    // the stock check on the same stale value.
    const lockedRows = await tx.$queryRaw<Array<{ id: string; currentStock: number; name: string }>>`
      SELECT id, "currentStock", name
      FROM products
      WHERE id = ANY(${productIds}::text[])
      FOR UPDATE
    `;

    const stockMap = new Map(lockedRows.map((r) => [r.id, { stock: r.currentStock, name: r.name }]));

    // Step 4: Check every item against locked stock values.
    // We check ALL items before throwing so we can report the first failure.
    for (const item of challan.items) {
      const row = stockMap.get(item.productId);
      if (!row) throw new Error(`Product not found: ${item.productId}`);

      if (item.quantity > row.stock) {
        // Throw with product name so the frontend can show a meaningful message
        throw new InsufficientStockError(item.productName, row.stock, item.quantity);
      }
    }

    // Step 5: All stock checks passed. Now deduct and record movements.
    // We do this sequentially (not Promise.all) to keep the transaction clean.
    for (const item of challan.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { currentStock: { decrement: item.quantity } },
      });

      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          quantity: item.quantity,
          type: 'OUT',
          // Reason references the challan number so the movement is traceable
          reason: `Sales Challan ${challan.challanNumber}`,
          createdById: userId,
        },
      });
    }

    // Step 6: Mark challan as CONFIRMED
    const confirmed = await tx.challan.update({
      where: { id },
      data: { status: 'CONFIRMED' },
      include: {
        customer: { select: { id: true, customerName: true, businessName: true } },
        createdBy: { select: { id: true, name: true } },
        items: true,
      },
    });

    return {
      ...confirmed,
      items: confirmed.items.map((item) => ({ ...item, unitPrice: Number(item.unitPrice) })),
    };
  });
}

// ─── Cancel Challan ───────────────────────────────────────────────────────────
// DRAFT → CANCELLED: safe, no stock was ever touched.
// CONFIRMED → CANCELLED: NOT allowed via this API.
//   A confirmed challan has already reduced stock and created audit movements.
//   Reversing it requires compensating stock-IN movements, which is a separate
//   business operation outside the scope of this module.
//   We explicitly block it to prevent silent inventory inconsistency.
export async function cancelChallan(id: string) {
  const challan = await prisma.challan.findUnique({ where: { id } });
  if (!challan) throw new ChallanNotFoundError();

  if (challan.status === 'CONFIRMED') {
    throw new InvalidStatusTransitionError(
      'CONFIRMED',
      'CANCELLED — confirmed challans cannot be cancelled directly; create a stock-IN reversal instead',
    );
  }

  if (challan.status === 'CANCELLED') {
    throw new InvalidStatusTransitionError('CANCELLED', 'CANCELLED');
  }

  return prisma.challan.update({
    where: { id },
    data: { status: 'CANCELLED' },
  });
}
