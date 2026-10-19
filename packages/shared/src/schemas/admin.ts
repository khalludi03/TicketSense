import { z } from 'zod';

export const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const updateUserSchema = z
  .object({
    role: z.enum(['customer', 'agent', 'admin']).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => data.role !== undefined || data.isActive !== undefined, {
    message: 'At least one of role or isActive must be provided',
  });

export type CategoryInput = z.infer<typeof categorySchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
