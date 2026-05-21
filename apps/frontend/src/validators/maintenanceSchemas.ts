import { z } from 'zod';
import { MaintenancePriority, MaintenanceStatus } from '../types';

export const titleField = z
  .string()
  .trim()
  .min(3, 'Title must be at least 3 characters')
  .max(120);

export const descriptionField = z
  .string()
  .trim()
  .min(1, 'Description is required')
  .max(2000);

export const priorityField = z.nativeEnum(MaintenancePriority);

export const statusField = z.nativeEnum(MaintenanceStatus);
