import { Request, Response } from 'express';
import {
  stockInSchema,
  stockOutSchema,
  movementQuerySchema,
} from '../validators/inventory.validator';
import * as inventoryService from '../services/inventory.service';
import { AppError, InsufficientStockError } from '../utils/errors';

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
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ success: false, code: err.code, message: err.message });
      return;
    }
    const message = err instanceof Error ? err.message : 'Not found';
    res.status(404).json({ success: false, message });
  }
}

export async function handleStockIn(req: Request, res: Response): Promise<void> {
  const result = stockInSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: result.error.flatten().fieldErrors,
    });
    return;
  }
  try {
    const data = await inventoryService.stockIn(result.data, req.user!.userId);
    res.status(201).json({ success: true, ...data });
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ success: false, code: err.code, message: err.message });
      return;
    }
    const message = err instanceof Error ? err.message : 'Stock IN failed';
    const status = message.includes('not found') ? 404 : 500;
    res.status(status).json({ success: false, message });
  }
}

export async function handleStockOut(req: Request, res: Response): Promise<void> {
  const result = stockOutSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: result.error.flatten().fieldErrors,
    });
    return;
  }
  try {
    const data = await inventoryService.stockOut(result.data, req.user!.userId);
    res.status(201).json({ success: true, ...data });
  } catch (err) {
    if (err instanceof InsufficientStockError) {
      const firstItem = err.items[0];
      res.status(err.statusCode).json({
        success: false,
        code: err.code,
        message: 'Insufficient stock',
        available: firstItem?.available,
        requested: firstItem?.requested,
      });
      return;
    }
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ success: false, code: err.code, message: err.message });
      return;
    }
    const message = err instanceof Error ? err.message : 'Stock OUT failed';
    const status = message.includes('not found') ? 404 : 500;
    res.status(status).json({ success: false, message });
  }
}
