import { Request, Response } from 'express';
import {
  createCustomerSchema,
  updateCustomerSchema,
  customerQuerySchema,
  createFollowUpSchema,
} from '../validators/customer.validator';
import * as customerService from '../services/customer.service';

export async function getCustomers(req: Request, res: Response): Promise<void> {
  const result = customerQuerySchema.safeParse(req.query);
  if (!result.success) {
    res.status(400).json({ success: false, errors: result.error.flatten().fieldErrors });
    return;
  }
  try {
    const data = await customerService.listCustomers(result.data);
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch customers' });
  }
}

export async function getCustomer(req: Request, res: Response): Promise<void> {
  try {
    const customer = await customerService.getCustomerById(req.params['id']!);
    res.json({ success: true, customer });
  } catch (err) {
    res.status(404).json({ success: false, message: err instanceof Error ? err.message : 'Not found' });
  }
}

export async function createCustomer(req: Request, res: Response): Promise<void> {
  const result = createCustomerSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ success: false, message: 'Validation failed', errors: result.error.flatten().fieldErrors });
    return;
  }
  try {
    const customer = await customerService.createCustomer(result.data, req.user!.userId);
    res.status(201).json({ success: true, customer });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create customer' });
  }
}

export async function updateCustomer(req: Request, res: Response): Promise<void> {
  const result = updateCustomerSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ success: false, message: 'Validation failed', errors: result.error.flatten().fieldErrors });
    return;
  }
  try {
    const customer = await customerService.updateCustomer(req.params['id']!, result.data);
    res.json({ success: true, customer });
  } catch (err) {
    res.status(404).json({ success: false, message: err instanceof Error ? err.message : 'Not found' });
  }
}

export async function createFollowUp(req: Request, res: Response): Promise<void> {
  const result = createFollowUpSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ success: false, message: 'Validation failed', errors: result.error.flatten().fieldErrors });
    return;
  }
  try {
    const followUp = await customerService.addFollowUp(req.params['id']!, result.data, req.user!.userId);
    res.status(201).json({ success: true, followUp });
  } catch (err) {
    res.status(404).json({ success: false, message: err instanceof Error ? err.message : 'Not found' });
  }
}

export async function getFollowUps(req: Request, res: Response): Promise<void> {
  try {
    const followUps = await customerService.getFollowUps(req.params['id']!);
    res.json({ success: true, followUps });
  } catch (err) {
    res.status(404).json({ success: false, message: err instanceof Error ? err.message : 'Not found' });
  }
}
