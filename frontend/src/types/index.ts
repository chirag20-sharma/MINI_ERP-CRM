export type Role = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';
export type CustomerType = 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR';
export type CustomerStatus = 'LEAD' | 'ACTIVE' | 'INACTIVE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface Customer {
  id: string;
  customerName: string;
  mobile: string;
  email: string | null;
  businessName: string;
  gstNumber: string | null;
  customerType: CustomerType;
  address: string;
  status: CustomerStatus;
  followUpDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; name: string };
  _count?: { followUps: number; challans: number };
}

export interface FollowUp {
  id: string;
  note: string;
  followUpDate: string;
  createdAt: string;
  createdBy: { id: string; name: string };
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitPrice: number;
  currentStock: number;
  minimumStock: number;
  warehouseLocation: string;
  isLowStock: boolean;
  createdAt: string;
  updatedAt: string;
}

export type StockMovementType = 'IN' | 'OUT';

export interface StockMovement {
  id: string;
  quantity: number;
  type: StockMovementType;
  reason: string;
  createdAt: string;
  product: { id: string; name: string; sku: string };
  createdBy: { id: string; name: string };
}

export type ChallanStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

export interface ChallanItem {
  id: string;
  challanId: string;
  productId: string;
  productName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  createdAt: string;
  product?: { id: string; currentStock: number };
}

export interface Challan {
  id: string;
  challanNumber: string;
  totalQuantity: number;
  status: ChallanStatus;
  createdAt: string;
  updatedAt: string;
  customer: { id: string; customerName: string; businessName: string; mobile?: string };
  createdBy: { id: string; name: string };
  items: ChallanItem[];
  _count?: { items: number };
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}
