import apiFetch from './api';
import { Customer, FollowUp, Pagination } from '../types';

export interface CustomerListResponse {
  success: boolean;
  customers: Customer[];
  pagination: Pagination;
}

export interface CustomerFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  customerType?: string;
}

export function getCustomers(filters: CustomerFilters = {}): Promise<CustomerListResponse> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => { if (v !== undefined && v !== '') params.set(k, String(v)); });
  return apiFetch(`/customers?${params.toString()}`);
}

export function getCustomer(id: string): Promise<{ success: boolean; customer: Customer }> {
  return apiFetch(`/customers/${id}`);
}

export function createCustomer(data: Partial<Customer>): Promise<{ success: boolean; customer: Customer }> {
  return apiFetch('/customers', { method: 'POST', body: JSON.stringify(data) });
}

export function updateCustomer(id: string, data: Partial<Customer>): Promise<{ success: boolean; customer: Customer }> {
  return apiFetch(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function getFollowUps(customerId: string): Promise<{ success: boolean; followUps: FollowUp[] }> {
  return apiFetch(`/customers/${customerId}/followups`);
}

export function addFollowUp(customerId: string, data: { note: string; followUpDate: string }): Promise<{ success: boolean; followUp: FollowUp }> {
  return apiFetch(`/customers/${customerId}/followups`, { method: 'POST', body: JSON.stringify(data) });
}
