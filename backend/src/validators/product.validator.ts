import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(150).trim(),
  sku: z.string().min(1, 'SKU is required').max(50).trim(),
  category: z.string().min(1, 'Category is required').max(100).trim(),
  unitPrice: z.coerce.number().min(0, 'Unit price must be >= 0'),
  currentStock: z.coerce.number().int().min(0, 'Stock must be >= 0').default(0),
  minimumStock: z.coerce.number().int().min(0, 'Minimum stock must be >= 0').default(0),
  warehouseLocation: z.string().min(1, 'Warehouse location is required').max(100).trim(),
});

export const updateProductSchema = createProductSchema.partial();

export const productQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  category: z.string().optional(),
  lowStock: z.enum(['true', 'false']).optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQuery = z.infer<typeof productQuerySchema>;
