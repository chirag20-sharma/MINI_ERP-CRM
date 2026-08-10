import apiFetch from './api';
import { Challan, Pagination } from '../types';

interface ChallanListResponse {
  success: boolean;
  challans: Challan[];
  pagination: Pagination;
}

interface ChallanResponse {
  success: boolean;
  challan: Challan;
}

export interface ChallanQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  customerId?: string;
}

export interface ChallanItemInput {
  productId: string;
  quantity: number;
}

export function getChallans(query: ChallanQuery = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => { if (v !== undefined && v !== '') params.set(k, String(v)); });
  return apiFetch<ChallanListResponse>(`/challans?${params.toString()}`);
}

export function getChallan(id: string) {
  return apiFetch<ChallanResponse>(`/challans/${id}`);
}

export function createChallan(customerId: string, items: ChallanItemInput[]) {
  return apiFetch<ChallanResponse>('/challans', {
    method: 'POST',
    body: JSON.stringify({ customerId, items }),
  });
}

export function updateChallan(id: string, customerId: string, items: ChallanItemInput[]) {
  return apiFetch<ChallanResponse>(`/challans/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ customerId, items }),
  });
}

export function confirmChallan(id: string) {
  return apiFetch<ChallanResponse>(`/challans/${id}/confirm`, { method: 'POST' });
}

export function cancelChallan(id: string) {
  return apiFetch<ChallanResponse>(`/challans/${id}/cancel`, { method: 'POST' });
}
