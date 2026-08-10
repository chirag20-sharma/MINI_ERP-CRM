import prisma from '../config/prisma';
import { CreateProductInput, UpdateProductInput, ProductQuery } from '../validators/product.validator';

export async function listProducts(query: ProductQuery) {
  const { page, limit, search, category, lowStock } = query;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (category) where['category'] = { equals: category, mode: 'insensitive' };

  if (search) {
    where['OR'] = [
      { name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
      { category: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.product.count({ where }),
  ]);

  // Prisma cannot compare two columns directly without raw SQL,
  // so low-stock filtering is applied in-memory after the DB fetch.
  const filtered = lowStock === 'true'
    ? products.filter(p => p.currentStock < p.minimumStock)
    : products;

  // Attach isLowStock flag to every product in the response
  const enriched = filtered.map(p => ({
    ...p,
    unitPrice: Number(p.unitPrice),
    isLowStock: p.currentStock < p.minimumStock,
  }));

  return {
    products: enriched,
    pagination: {
      total: lowStock === 'true' ? enriched.length : total,
      page,
      limit,
      totalPages: Math.ceil((lowStock === 'true' ? enriched.length : total) / limit),
    },
  };
}

export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new Error('Product not found');
  return {
    ...product,
    unitPrice: Number(product.unitPrice),
    isLowStock: product.currentStock < product.minimumStock,
  };
}

export async function createProduct(data: CreateProductInput) {
  const existing = await prisma.product.findUnique({ where: { sku: data.sku } });
  if (existing) throw new Error(`SKU "${data.sku}" already exists`);

  const product = await prisma.product.create({ data });
  return { ...product, unitPrice: Number(product.unitPrice), isLowStock: product.currentStock < product.minimumStock };
}

export async function updateProduct(id: string, data: UpdateProductInput) {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw new Error('Product not found');

  // If SKU is being changed, ensure the new SKU is not taken by another product
  if (data.sku && data.sku !== existing.sku) {
    const skuTaken = await prisma.product.findUnique({ where: { sku: data.sku } });
    if (skuTaken) throw new Error(`SKU "${data.sku}" already exists`);
  }

  const product = await prisma.product.update({ where: { id }, data });
  return { ...product, unitPrice: Number(product.unitPrice), isLowStock: product.currentStock < product.minimumStock };
}
