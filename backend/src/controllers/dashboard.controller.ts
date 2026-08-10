import { Request, Response } from 'express';
import prisma from '../config/prisma';

export async function getDashboard(_req: Request, res: Response): Promise<void> {
  try {
    const [totalCustomers, totalProducts, totalChallans, allProducts, recentChallans] =
      await Promise.all([
        prisma.customer.count(),
        prisma.product.count(),
        prisma.challan.count(),
        prisma.product.findMany({
          select: { id: true, name: true, sku: true, currentStock: true, minimumStock: true },
          orderBy: { currentStock: 'asc' },
        }),
        prisma.challan.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            customer: { select: { customerName: true, businessName: true } },
            createdBy: { select: { name: true } },
          },
        }),
      ]);

    const lowStockProducts = allProducts.filter(p => p.currentStock <= p.minimumStock).slice(0, 10);

    res.json({
      success: true,
      stats: {
        totalCustomers,
        totalProducts,
        totalChallans,
        lowStockCount: lowStockProducts.length,
      },
      lowStockProducts,
      recentChallans,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load dashboard';
    res.status(500).json({ success: false, message });
  }
}
