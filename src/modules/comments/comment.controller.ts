import type { Request, Response } from 'express';
import { commentService } from './comment.service.js';
import type { AuthenticatedRequest } from '../../types/auth.js';
import type { CreateCommentInput, ListCommentQuery } from './comment.schema';

function authUser(request: Request) {
  return (request as AuthenticatedRequest).user!;
}

export class CommentController {
  async create(request: Request, response: Response) {
    const comment = await commentService.createComment(
      authUser(request),
      String(request.params.id),
      request.body as CreateCommentInput
    );
    response.status(201).json({ data: comment });
  }
  async getCommentsById(request: Request, response: Response) {
    const result = await commentService.getCommentByTicketId(
      authUser(request),
      String(request.params.id),
      request.query as unknown as ListCommentQuery
    );
    response.json(result);
  }
}

export const commentController = new CommentController();
