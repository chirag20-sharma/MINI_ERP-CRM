import { Prisma } from '../generated/prisma/client';
import prisma from '../config/prisma';
import { StockInInput, StockOutInput, MovementQuery } from '../validators/inventory.validator';
import { AppError, ProductNotFoundError, InsufficientStockError } from '../utils/errors';

export { InsufficientStockError, AppError };

// ─── Stock IN ─────────────────────────────────────────────────────────────────
export async function stockIn(data: StockInInput, userId: string) {
  return prisma.$transaction(
    async (tx) => {
      // 1. Atomically increment stock and verify existence
      let updated;
      try {
        updated = await tx.product.update({
          where: { id: data.productId },
          data: { currentStock: { increment: data.quantity } },
          select: { id: true, name: true, sku: true, currentStock: true },
        });
      } catch {
        throw new ProductNotFoundError(data.productId);
      }

      // 2. Create the audit record
      const movement = await tx.stockMovement.create({
        data: {
          productId: data.productId,
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
    },
    { timeout: 10000, maxWait: 5000, isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted }
  );
}

// ─── Stock OUT ────────────────────────────────────────────────────────────────
export async function stockOut(data: StockOutInput, userId: string) {
  return prisma.$transaction(
    async (tx) => {
      // 1. Lock the product row for the duration of the transaction
      const rows = await tx.$queryRaw<Array<{ currentStock: number; name: string }>>`
        SELECT "currentStock", name FROM products WHERE id = ${data.productId} FOR UPDATE
      `;

      if (rows.length === 0) {
        throw new ProductNotFoundError(data.productId);
      }

      const { currentStock, name } = rows[0]!;

      // 2. Enforce the non-negative stock constraint
      if (data.quantity > currentStock) {
        throw new InsufficientStockError([
          {
            productName: name,
            available: currentStock,
            requested: data.quantity,
          },
        ]);
      }

      // 3. Decrement stock
      const updated = await tx.product.update({
        where: { id: data.productId },
        data: { currentStock: { decrement: data.quantity } },
      });

      // 4. Create the audit record
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
    },
    { timeout: 10000, maxWait: 5000, isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted }
  );
}

// ─── List Movements ───────────────────────────────────────────────────────────
export async function listMovements(query: MovementQuery) {
  const { page, limit, productId, type } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.StockMovementWhereInput = {
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
  if (!product) throw new ProductNotFoundError(productId);

  return listMovements({ ...query, productId });
}
