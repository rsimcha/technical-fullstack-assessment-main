import { z } from 'zod';

export const listUsersQuerySchema = z
  .object({
    role: z.enum(['admin', 'manager', 'tenant']).optional(),
  })
  .strict();

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
