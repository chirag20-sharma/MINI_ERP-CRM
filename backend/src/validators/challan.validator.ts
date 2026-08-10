import { z } from 'zod';

export const challanItemInputSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
});

export const createChallanSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  items: z
    .array(challanItemInputSchema)
    .min(1, 'At least one item is required')
    .refine(
      (items) => {
        const ids = items.map((i) => i.productId);
        return new Set(ids).size === ids.length;
      },
      { message: 'Duplicate products are not allowed in the same challan' }
    ),
});

// Only items can be updated on a DRAFT challan
export const updateChallanSchema = z.object({
  customerId: z.string().min(1).optional(),
  items: z
    .array(challanItemInputSchema)
    .min(1, 'At least one item is required')
    .refine(
      (items) => {
        const ids = items.map((i) => i.productId);
        return new Set(ids).size === ids.length;
      },
      { message: 'Duplicate products are not allowed' }
    )
    .optional(),
});

export const challanQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  status: z.enum(['DRAFT', 'CONFIRMED', 'CANCELLED']).optional(),
  customerId: z.string().optional(),
});

export type CreateChallanInput = z.infer<typeof createChallanSchema>;
export type UpdateChallanInput = z.infer<typeof updateChallanSchema>;
export type ChallanQuery = z.infer<typeof challanQuerySchema>;
