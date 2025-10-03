import { Request } from 'express';

export interface AuthUser {
  id: number;
  email: string;
  role: 'user' | 'seller' | 'user_seller' | 'admin';
  status: 'active' | 'inactive' | 'deleted' | 'suspended';
}

export interface AuthRequest extends Request {
  user?: AuthUser;
  requestId?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface FilterParams {
  categoryId?: number;
  type?: string;
  color?: string;
  size?: string;
  minPrice?: number;
  maxPrice?: number;
  wearingTime?: string;
  status?: string;
  availability?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  requestId?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
