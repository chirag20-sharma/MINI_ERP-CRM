import { Request, Response } from 'express';
import { stockInSchema, stockOutSchema, movementQuerySchema } from '../validators/inventory.validator';
import * as inventoryService from '../services/inventory.service';
import { InsufficientStockError } from '../services/inventory.service';

export async function getMovements(req: Request, res: Response): Promise<void> {
  const result = movementQuerySchema.safeParse(req.query);
  if (!result.success) {
    res.status(400).json({ success: false, errors: result.error.flatten().fieldErrors });
    return;
  }
  try {
    const data = await inventoryService.listMovements(result.data);
    res.json({ success: true, ...data });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch movements' });
  }
}

export async function getMovementsByProduct(req: Request, res: Response): Promise<void> {
  const result = movementQuerySchema.safeParse(req.query);
  if (!result.success) {
    res.status(400).json({ success: false, errors: result.error.flatten().fieldErrors });
    return;
  }
  try {
    const data = await inventoryService.listMovementsByProduct(req.params['productId']!, result.data);
    res.json({ success: true, ...data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Not found';
    res.status(404).json({ success: false, message });
  }
}

export async function handleStockIn(req: Request, res: Response): Promise<void> {
  const result = stockInSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ success: false, message: 'Validation failed', errors: result.error.flatten().fieldErrors });
    return;
  }
  try {
    const data = await inventoryService.stockIn(result.data, req.user!.userId);
    res.status(201).json({ success: true, ...data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Stock IN failed';
    const status = message.includes('not found') ? 404 : 500;
    res.status(status).json({ success: false, message });
  }
}

export async function handleStockOut(req: Request, res: Response): Promise<void> {
  const result = stockOutSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ success: false, message: 'Validation failed', errors: result.error.flatten().fieldErrors });
    return;
  }
  try {
    const data = await inventoryService.stockOut(result.data, req.user!.userId);
    res.status(201).json({ success: true, ...data });
  } catch (err) {
    // InsufficientStockError gets a specific 400 with available/requested fields
    if (err instanceof InsufficientStockError) {
      res.status(400).json({
        success: false,
        message: 'Insufficient stock',
        available: err.available,
        requested: err.requested,
      });
      return;
    }
    const message = err instanceof Error ? err.message : 'Stock OUT failed';
    const status = message.includes('not found') ? 404 : 500;
    res.status(status).json({ success: false, message });
  }
}
