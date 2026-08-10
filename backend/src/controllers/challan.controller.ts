import { Request, Response } from 'express';
import {
  createChallanSchema,
  updateChallanSchema,
  challanQuerySchema,
} from '../validators/challan.validator';
import * as challanService from '../services/challan.service';
import {
  ChallanNotFoundError,
  InvalidStatusTransitionError,
  InsufficientStockError,
} from '../services/challan.service';

function handleError(err: unknown, res: Response): void {
  if (err instanceof ChallanNotFoundError) {
    res.status(404).json({ success: false, message: err.message });
    return;
  }
  if (err instanceof InvalidStatusTransitionError) {
    res.status(409).json({ success: false, message: err.message });
    return;
  }
  if (err instanceof InsufficientStockError) {
    res.status(400).json({
      success: false,
      message: `Insufficient stock for "${err.productName}"`,
      product: err.productName,
      available: err.available,
      requested: err.requested,
    });
    return;
  }
  const message = err instanceof Error ? err.message : 'Operation failed';
  const status = message.toLowerCase().includes('not found') ? 404 : 500;
  res.status(status).json({ success: false, message });
}

export async function getChallans(req: Request, res: Response): Promise<void> {
  const result = challanQuerySchema.safeParse(req.query);
  if (!result.success) {
    res.status(400).json({ success: false, errors: result.error.flatten().fieldErrors });
    return;
  }
  try {
    const data = await challanService.listChallans(result.data);
    res.json({ success: true, ...data });
  } catch (err) { handleError(err, res); }
}

export async function getChallan(req: Request, res: Response): Promise<void> {
  try {
    const challan = await challanService.getChallanById(req.params['id']!);
    res.json({ success: true, challan });
  } catch (err) { handleError(err, res); }
}

export async function createChallan(req: Request, res: Response): Promise<void> {
  const result = createChallanSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ success: false, message: 'Validation failed', errors: result.error.flatten().fieldErrors });
    return;
  }
  try {
    const challan = await challanService.createChallan(result.data, req.user!.userId);
    res.status(201).json({ success: true, challan });
  } catch (err) { handleError(err, res); }
}

export async function updateChallan(req: Request, res: Response): Promise<void> {
  const result = updateChallanSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ success: false, message: 'Validation failed', errors: result.error.flatten().fieldErrors });
    return;
  }
  try {
    const challan = await challanService.updateChallan(req.params['id']!, result.data);
    res.json({ success: true, challan });
  } catch (err) { handleError(err, res); }
}

export async function confirmChallan(req: Request, res: Response): Promise<void> {
  try {
    const challan = await challanService.confirmChallan(req.params['id']!, req.user!.userId);
    res.json({ success: true, challan });
  } catch (err) { handleError(err, res); }
}

export async function cancelChallan(req: Request, res: Response): Promise<void> {
  try {
    const challan = await challanService.cancelChallan(req.params['id']!);
    res.json({ success: true, challan });
  } catch (err) { handleError(err, res); }
}
