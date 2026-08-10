import prisma from '../config/prisma';
import { StockInInput, StockOutInput, MovementQuery } from '../validators/inventory.validator';

// ─── Insufficient Stock Error ─────────────────────────────────────────────────
// A typed error so the controller can distinguish it from a generic 500
export class InsufficientStockError extends Error {
  constructor(public available: number, public requested: number) {
    super('Insufficient stock');
    this.name = 'InsufficientStockError';
  }
}

// ─── Stock IN ─────────────────────────────────────────────────────────────────
// Adds stock to a product and records the movement — all inside one transaction.
export async function stockIn(data: StockInInput, userId: string) {
  return prisma.$transaction(async (tx) => {
    // Step 1: Verify the product exists.
    // We use findUniqueOrThrow so Prisma throws if not found — transaction rolls back.
    const product = await tx.product.findUniqueOrThrow({
      where: { id: data.productId },
    });

    // Step 2: Update currentStock by incrementing it.
    // Prisma's { increment } maps to SQL: SET current_stock = current_stock + N
    // This is atomic at the database level — no read-then-write race condition.
    const updated = await tx.product.update({
      where: { id: product.id },
      data: { currentStock: { increment: data.quantity } },
    });

    // Step 3: Create the audit record.
    const movement = await tx.stockMovement.create({
      data: {
        productId: product.id,
        quantity: data.quantity,
        type: 'IN',
        reason: data.reason,
        createdById: userId,
      },
      include: {
        product: { select: { id: true, name: true, sku: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    return {
      movement,
      currentStock: updated.currentStock,
    };
  });
}

// ─── Stock OUT ────────────────────────────────────────────────────────────────
// Removes stock from a product — enforces the "never negative" rule inside a
// transaction with a row-level lock to prevent race conditions.
export async function stockOut(data: StockOutInput, userId: string) {
  return prisma.$transaction(async (tx) => {
    // Step 1: Lock the product row for the duration of this transaction.
    // $queryRaw with SELECT ... FOR UPDATE prevents another concurrent transaction
    // from reading the same row until this one commits or rolls back.
    // This is the correct solution to the race condition described in the spec.
    const rows = await tx.$queryRaw<Array<{ currentStock: number }>>`
      SELECT "currentStock" FROM products WHERE id = ${data.productId} FOR UPDATE
    `;

    if (rows.length === 0) throw new Error('Product not found');

    const currentStock = rows[0]!.currentStock;

    // Step 2: Enforce the "never negative" business rule.
    if (data.quantity > currentStock) {
      throw new InsufficientStockError(currentStock, data.quantity);
    }

    // Step 3: Decrement stock — safe because we hold the row lock.
    const updated = await tx.product.update({
      where: { id: data.productId },
      data: { currentStock: { decrement: data.quantity } },
    });

    // Step 4: Create the audit record.
    const movement = await tx.stockMovement.create({
      data: {
        productId: data.productId,
        quantity: data.quantity,
        type: 'OUT',
        reason: data.reason,
        createdById: userId,
      },
      include: {
        product: { select: { id: true, name: true, sku: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    return {
      movement,
      currentStock: updated.currentStock,
    };
  });
}

// ─── List Movements ───────────────────────────────────────────────────────────
export async function listMovements(query: MovementQuery) {
  const { page, limit, productId, type } = query;
  const skip = (page - 1) * limit;

  const where = {
    ...(productId && { productId }),
    ...(type && { type }),
  };

  const [movements, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { id: true, name: true, sku: true } },
        createdBy: { select: { id: true, name: true } },
      },
    }),
    prisma.stockMovement.count({ where }),
  ]);

  return {
    movements,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

// ─── Movements for a specific product ────────────────────────────────────────
export async function listMovementsByProduct(productId: string, query: MovementQuery) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error('Product not found');

  return listMovements({ ...query, productId });
}
