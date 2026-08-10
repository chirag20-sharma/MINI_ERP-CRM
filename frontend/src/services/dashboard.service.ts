import apiFetch from './api';
import { ChallanStatus } from '../types';

export interface DashboardStats {
  totalCustomers: number;
  totalProducts: number;
  totalChallans: number;
  lowStockCount: number;
}

export interface LowStockProduct {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  minimumStock: number;
}

export interface RecentChallan {
  id: string;
  challanNumber: string;
  totalQuantity: number;
  status: ChallanStatus;
  createdAt: string;
  customer: { customerName: string; businessName: string };
  createdBy: { name: string };
}

export interface DashboardResponse {
  success: boolean;
  stats: DashboardStats;
  lowStockProducts: LowStockProduct[];
  recentChallans: RecentChallan[];
}

export function getDashboardData() {
  return apiFetch<DashboardResponse>('/dashboard');
}
