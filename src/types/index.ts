import { Request } from 'express'

export interface AuthUser {
  id: number
  phone: string
  email?: string | null
  role: 'user' | 'admin'
  status: 'active' | 'inactive' | 'deleted' | 'suspended'
  phoneVerified: boolean
  nidFrontUrl?: string | null
  nidBackUrl?: string | null
}

export interface AuthRequest extends Request {
  user?: AuthUser
  requestId?: string
}

export interface PaginationParams {
  page?: number
  limit?: number
}

export interface FilterParams {
  categoryId?: number
  type?: string
  color?: string
  size?: string
  minPrice?: number
  maxPrice?: number
  wearingTime?: string
  status?: string
  availability?: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  requestId?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
