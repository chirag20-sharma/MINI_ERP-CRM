import { z } from 'zod';

const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export const createCustomerSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required').max(100),
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  businessName: z.string().min(1, 'Business name is required').max(150),
  gstNumber: z
    .string()
    .regex(GST_REGEX, 'Invalid GST number format')
    .optional()
    .or(z.literal('')),
  customerType: z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR']),
  address: z.string().min(1, 'Address is required').max(300),
  status: z.enum(['LEAD', 'ACTIVE', 'INACTIVE']).default('LEAD'),
  followUpDate: z.string().datetime({ offset: true }).optional().or(z.literal('')),
  notes: z.string().max(1000).optional().or(z.literal('')),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const customerQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  status: z.enum(['LEAD', 'ACTIVE', 'INACTIVE']).optional(),
  customerType: z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR']).optional(),
});

export const createFollowUpSchema = z.object({
  note: z.string().min(1, 'Note is required').max(1000),
  followUpDate: z.string().datetime({ offset: true }),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CustomerQuery = z.infer<typeof customerQuerySchema>;
export type CreateFollowUpInput = z.infer<typeof createFollowUpSchema>;
