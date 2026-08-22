import { Prisma } from '../generated/prisma/client';
import prisma from '../config/prisma';
import { CreateChallanInput, UpdateChallanInput, ChallanQuery } from '../validators/challan.validator';
import { enqueuePDFGeneration } from '../queues/queue.service';
import {
  AppError,
  ChallanNotFoundError,
  InvalidStatusTransitionError,
  InsufficientStockError,
  CustomerNotFoundError,
  ProductNotFoundError,
} from '../utils/errors';

export {
  AppError,
  ChallanNotFoundError,
  InvalidStatusTransitionError,
  InsufficientStockError,
};

// ─── Atomic Sequence Generator with Table Max Fallback ────────────────────────
async function generateChallanNumber(tx: Prisma.TransactionClient): Promise<string> {
  try {
    const result = await tx.$queryRaw<Array<{ next_val: bigint | number | string }>>`
      SELECT nextval('challan_number_seq') AS next_val
    `;
    if (result && result[0]?.next_val != null) {
      const seq = Number(result[0].next_val);
      return `CH-${String(seq).padStart(4, '0')}`;
    }
  } catch {
    // Fallback if PostgreSQL sequence has not been applied yet
  }

  const last = await tx.challan.findFirst({
    orderBy: { challanNumber: 'desc' },
    select: { challanNumber: true },
  });

  if (!last) return 'CH-0001';
  const num = parseInt(last.challanNumber.replace('CH-', ''), 10) || 0;
  return `CH-${String(num + 1).padStart(4, '0')}`;
}

// ─── List Challans ────────────────────────────────────────────────────────────
export async function listChallans(query: ChallanQuery) {
  const { page, limit, search, status, customerId } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.ChallanWhereInput = {
    ...(status && { status }),
    ...(customerId && { customerId }),
    ...(search && {
      challanNumber: { contains: search, mode: 'insensitive' },
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
export async function createChallan(data: CreateChallanInput, userId: string) {
  return prisma.$transaction(
    async (tx) => {
      const customer = await tx.customer.findUnique({ where: { id: data.customerId } });
      if (!customer) throw new CustomerNotFoundError();

      const productIds = Array.from(new Set(data.items.map((i) => i.productId)));
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
      });

      if (products.length !== productIds.length) {
        const foundIds = new Set(products.map((p) => p.id));
        const missing = productIds.find((id) => !foundIds.has(id));
        throw new ProductNotFoundError(missing);
      }

      const productMap = new Map(products.map((p) => [p.id, p]));
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
    },
    { timeout: 10000, maxWait: 5000, isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted }
  );
}

// ─── Update Draft Challan ─────────────────────────────────────────────────────
export async function updateChallan(id: string, data: UpdateChallanInput) {
  return prisma.$transaction(
    async (tx) => {
      const challan = await tx.challan.findUnique({ where: { id } });
      if (!challan) throw new ChallanNotFoundError();
      if (challan.status !== 'DRAFT') {
        throw new InvalidStatusTransitionError(challan.status, 'DRAFT (edit)');
      }

      if (data.items) {
        const productIds = Array.from(new Set(data.items.map((i) => i.productId)));
        const products = await tx.product.findMany({ where: { id: { in: productIds } } });

        if (products.length !== productIds.length) {
          const foundIds = new Set(products.map((p) => p.id));
          const missing = productIds.find((id) => !foundIds.has(id));
          throw new ProductNotFoundError(missing);
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
    },
    { timeout: 10000, maxWait: 5000 }
  );
}

// ─── Confirm Challan (Deadlock-Proof, Canonical Locking & Batch Write) ────────
export async function confirmChallan(id: string, userId: string) {
  const result = await prisma.$transaction(
    async (tx) => {
      // 1. Fetch Challan
      const challan = await tx.challan.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!challan) throw new ChallanNotFoundError();

      if (challan.status !== 'DRAFT') {
        throw new InvalidStatusTransitionError(challan.status, 'CONFIRMED');
      }

      if (challan.items.length === 0) {
        throw new AppError(400, 'EMPTY_CHALLAN', 'Cannot confirm a challan with no items');
      }

      // 2. Aggregate requested quantities per product to prevent over-allocation
      const requiredQtyMap = new Map<string, number>();
      for (const item of challan.items) {
        requiredQtyMap.set(
          item.productId,
          (requiredQtyMap.get(item.productId) || 0) + item.quantity
        );
      }

      // 3. CANONICAL SORTING: Sort product IDs to prevent deadlock cycles across transactions
      const sortedProductIds = Array.from(requiredQtyMap.keys()).sort();

      // 4. Lock all product rows in deterministic order
      const lockedProducts = await tx.$queryRaw<Array<{ id: string; currentStock: number; name: string }>>`
        SELECT id, "currentStock", name
        FROM products
        WHERE id = ANY(${sortedProductIds}::text[])
        ORDER BY id ASC
        FOR UPDATE
      `;

      if (lockedProducts.length !== sortedProductIds.length) {
        throw new AppError(404, 'PRODUCT_NOT_FOUND', 'One or more products no longer exist');
      }

      const productStockMap = new Map(lockedProducts.map((p) => [p.id, p]));

      // 5. Check all stock availability
      const stockErrors: Array<{ productName: string; available: number; requested: number }> = [];
      for (const [productId, requestedQty] of requiredQtyMap.entries()) {
        const product = productStockMap.get(productId)!;
        if (product.currentStock < requestedQty) {
          stockErrors.push({
            productName: product.name,
            available: product.currentStock,
            requested: requestedQty,
          });
        }
      }

      if (stockErrors.length > 0) {
        throw new InsufficientStockError(stockErrors);
      }

      // 6. Execute atomic stock decrements per product
      for (const [productId, requestedQty] of requiredQtyMap.entries()) {
        await tx.product.update({
          where: { id: productId },
          data: { currentStock: { decrement: requestedQty } },
        });
      }

      // 7. Batch insert stock movement audit records in a single round-trip
      await tx.stockMovement.createMany({
        data: challan.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          type: 'OUT' as const,
          reason: `Sales Challan ${challan.challanNumber}`,
          createdById: userId,
        })),
      });

      // 8. Mark challan as CONFIRMED
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
    },
    { timeout: 15000, maxWait: 5000, isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted }
  );

  // Background Async Tasks (non-blocking post-commit)
  enqueuePDFGeneration(id).catch((err) =>
    console.error(`[Queue] Failed to enqueue PDF generation for challan ${id}:`, err)
  );

  return result;
}

// ─── Cancel Challan ───────────────────────────────────────────────────────────
export async function cancelChallan(id: string) {
  const challan = await prisma.challan.findUnique({ where: { id } });
  if (!challan) throw new ChallanNotFoundError();

  if (challan.status === 'CONFIRMED') {
    throw new InvalidStatusTransitionError(
      'CONFIRMED',
      'CANCELLED (Confirmed challans require a formal stock-IN return entry)'
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
