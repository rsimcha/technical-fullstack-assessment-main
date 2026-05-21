import { z } from 'zod';
import {
  MaintenancePriority,
  MaintenanceStatus,
} from '../models/MaintenanceRequest';

// Auth validation schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required').trim(),
  lastName: z.string().min(1, 'Last name is required').trim(),
  role: z.enum(['admin', 'manager', 'tenant']).default('tenant'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// Query validation schemas
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  sort: z.string().default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

// Maintenance request schemas
const objectIdRegex = /^[a-fA-F0-9]{24}$/;
const objectId = z.string().regex(objectIdRegex, 'Invalid id format');

export const createMaintenanceRequestSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, 'Title must be at least 3 characters')
      .max(120),
    description: z
      .string()
      .trim()
      .min(1, 'Description is required')
      .max(2000),
    priority: z
      .nativeEnum(MaintenancePriority)
      .default(MaintenancePriority.NORMAL),
    propertyId: z
      .string()
      .trim()
      .min(1, 'Property identifier is required'),
  })
  .strict();

export const updateMaintenanceRequestSchema = z
  .object({
    title: z.string().trim().min(3).max(120).optional(),
    description: z.string().trim().min(1).max(2000).optional(),
    status: z.nativeEnum(MaintenanceStatus).optional(),
    priority: z.nativeEnum(MaintenancePriority).optional(),
    // null clears the assignment; an ObjectId sets it.
    assignedTo: z.union([objectId, z.null()]).optional(),
  })
  .strict()
  .refine(data => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  });

export const listMaintenanceQuerySchema = z
  .object({
    status: z.nativeEnum(MaintenanceStatus).optional(),
    priority: z.nativeEnum(MaintenancePriority).optional(),
    assignedTo: objectId.optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
  })
  .strict();

export const idParamSchema = z.object({ id: objectId }).strict();

// User listing schemas
export const listUsersQuerySchema = z
  .object({
    role: z.enum(['admin', 'manager', 'tenant']).optional(),
  })
  .strict();

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PaginationQuery = z.infer<typeof paginationSchema>;
export type CreateMaintenanceRequestInput = z.infer<
  typeof createMaintenanceRequestSchema
>;
export type UpdateMaintenanceRequestInput = z.infer<
  typeof updateMaintenanceRequestSchema
>;
export type ListMaintenanceQuery = z.infer<typeof listMaintenanceQuerySchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
