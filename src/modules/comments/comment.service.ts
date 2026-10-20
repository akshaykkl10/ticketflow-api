import type { AuthUser } from '../../types/auth.js';
import { TicketService } from '../tickets/ticket.service.js';
import { CommentRepository } from './comment.repository.js';
import type { CreateCommentInput, ListCommentQuery } from './comment.schema.js';

const repository = new CommentRepository();
const ticketService = new TicketService();

export class CommentService {
  async createComment(
    currentUser: AuthUser,
    ticketId: string,
    input: CreateCommentInput
  ) {
    await ticketService.getTicketById(currentUser, ticketId);
    return repository.create({
      content: input.content,
      ticketId,
      authorId: currentUser.userId
    });
  }
  async getCommentByTicketId(
    currentUser: AuthUser,
    ticketId: string,
    input: ListCommentQuery
  ) {
    await ticketService.getTicketById(currentUser, ticketId);
    const { items, total } = await repository.findManyByTicketId(
      ticketId,
      input
    );
    return {
      data: items,
      pagination: {
        page: input.page,
        limit: input.limit,
        total,
        totalPages: Math.ceil(total / input.limit)
      }
    };
  }
}

export const commentService = new CommentService();
