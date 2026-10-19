import { z } from 'zod';

export const createTicketSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(255, 'Title must be 255 characters or less'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
});

export const updateTicketStatusSchema = z
  .object({
    status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
    resolutionNote: z.string().min(1, 'Resolution note is required').optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status === 'resolved') {
      const note = data.resolutionNote?.trim();
      if (!note) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Resolution note is required when resolving a ticket',
          path: ['resolutionNote'],
        });
      }
    }
  });

export const assignTicketSchema = z.object({
  agentId: z.string().uuid().optional(),
});

export const addCommentSchema = z.object({
  body: z.string().min(1, 'Comment cannot be empty'),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketStatusInput = z.infer<typeof updateTicketStatusSchema>;
export type AssignTicketInput = z.infer<typeof assignTicketSchema>;
export type AddCommentInput = z.infer<typeof addCommentSchema>;
