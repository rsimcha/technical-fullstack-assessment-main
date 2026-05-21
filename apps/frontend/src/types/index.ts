export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'manager' | 'tenant';
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  errors?: Array<{ field: string; message: string }>;
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'admin' | 'manager' | 'tenant';
}

// Maintenance types
export enum MaintenanceStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum MaintenancePriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export interface MaintenanceUserSummary {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'manager' | 'tenant';
}

export interface MaintenanceRequest {
  _id: string;
  title: string;
  description: string;
  status: MaintenanceStatus;
  priority: MaintenancePriority;
  propertyId: string;
  createdBy: MaintenanceUserSummary;
  assignedTo?: MaintenanceUserSummary | null;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface MaintenanceListResponse {
  items: MaintenanceRequest[];
  pagination: Pagination;
}

export interface MaintenanceListFilters {
  status?: MaintenanceStatus;
  priority?: MaintenancePriority;
  assignedTo?: string;
  page?: number;
  limit?: number;
}

export interface CreateMaintenanceFormData {
  title: string;
  description: string;
  priority: MaintenancePriority;
  propertyId: string;
}

export interface UpdateMaintenanceFormData {
  title?: string;
  description?: string;
  status?: MaintenanceStatus;
  priority?: MaintenancePriority;
  assignedTo?: string | null;
}

export interface Manager {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}
