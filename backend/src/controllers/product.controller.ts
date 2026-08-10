import { Request, Response } from 'express';
import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
} from '../validators/product.validator';
import * as productService from '../services/product.service';

export async function getProducts(req: Request, res: Response): Promise<void> {
  const result = productQuerySchema.safeParse(req.query);
  if (!result.success) {
    res.status(400).json({ success: false, errors: result.error.flatten().fieldErrors });
    return;
  }
  try {
    const data = await productService.listProducts(result.data);
    res.json({ success: true, ...data });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch products' });
  }
}

export async function getProduct(req: Request, res: Response): Promise<void> {
  try {
    const product = await productService.getProductById(req.params['id']!);
    res.json({ success: true, product });
  } catch (err) {
    res.status(404).json({ success: false, message: err instanceof Error ? err.message : 'Not found' });
  }
}

export async function createProduct(req: Request, res: Response): Promise<void> {
  const result = createProductSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ success: false, message: 'Validation failed', errors: result.error.flatten().fieldErrors });
    return;
  }
  try {
    const product = await productService.createProduct(result.data);
    res.status(201).json({ success: true, product });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create product';
    // Duplicate SKU is a 409 Conflict, not a 500
    const status = message.includes('already exists') ? 409 : 500;
    res.status(status).json({ success: false, message });
  }
}

export async function updateProduct(req: Request, res: Response): Promise<void> {
  const result = updateProductSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ success: false, message: 'Validation failed', errors: result.error.flatten().fieldErrors });
    return;
  }
  try {
    const product = await productService.updateProduct(req.params['id']!, result.data);
    res.json({ success: true, product });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update product';
    const status = message.includes('not found') ? 404 : message.includes('already exists') ? 409 : 500;
    res.status(status).json({ success: false, message });
  }
}
