import apiFetch from './api';
import { StockMovement, Pagination } from '../types';

interface MovementListResponse {
  success: boolean;
  movements: StockMovement[];
  pagination: Pagination;
}

interface StockActionResponse {
  success: boolean;
  movement: StockMovement;
  currentStock: number;
}

export interface MovementQuery {
  page?: number;
  limit?: number;
  productId?: string;
  type?: 'IN' | 'OUT';
}

export function getMovements(query: MovementQuery = {}) {
  const params = new URLSearchParams();
  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  if (query.productId) params.set('productId', query.productId);
  if (query.type) params.set('type', query.type);
  return apiFetch<MovementListResponse>(`/inventory/stock-movements?${params.toString()}`);
}

export function stockIn(productId: string, quantity: number, reason: string) {
  return apiFetch<StockActionResponse>('/inventory/stock-in', {
    method: 'POST',
    body: JSON.stringify({ productId, quantity, reason }),
  });
}

export function stockOut(productId: string, quantity: number, reason: string) {
  return apiFetch<StockActionResponse>('/inventory/stock-out', {
    method: 'POST',
    body: JSON.stringify({ productId, quantity, reason }),
  });
}
