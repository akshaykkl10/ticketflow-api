import { z } from 'zod';
import { paginationQuerySchema } from '../tickets/ticket.schemas';

export const createCommentSchema = z.object({
  content: z.string().trim().min(1).max(3000)
});

export const listCommentQuerytSchema = paginationQuerySchema;

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type ListCommentQuery = z.infer<typeof listCommentQuerytSchema>;
