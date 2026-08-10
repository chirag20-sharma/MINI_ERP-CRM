import apiFetch from './api';
import { Product, Pagination } from '../types';

interface ProductListResponse {
  success: boolean;
  products: Product[];
  pagination: Pagination;
}

interface ProductResponse {
  success: boolean;
  product: Product;
}

export interface ProductQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  lowStock?: 'true' | 'false';
}

export function getProducts(query: ProductQuery = {}) {
  const params = new URLSearchParams();
  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  if (query.search) params.set('search', query.search);
  if (query.category) params.set('category', query.category);
  if (query.lowStock) params.set('lowStock', query.lowStock);
  return apiFetch<ProductListResponse>(`/products?${params.toString()}`);
}

export function getProduct(id: string) {
  return apiFetch<ProductResponse>(`/products/${id}`);
}

export function createProduct(data: Record<string, unknown>) {
  return apiFetch<ProductResponse>('/products', { method: 'POST', body: JSON.stringify(data) });
}

export function updateProduct(id: string, data: Record<string, unknown>) {
  return apiFetch<ProductResponse>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}
