import { Request, Response, NextFunction } from "express";
import { ContentBody, PostIdParams, IdParams } from "./comment.validation";
import { CommentService } from "./comment.service";
import { HTTPStatusText } from "../../types/HTTPStatusText";
import { SuccessMessages } from "../../types/successMessages";

export class CommentController {
  static async getMany(_req: Request, res: Response, next: NextFunction) {
    try {
      const { postId } = res.locals.params as PostIdParams;
      const comments = await CommentService.getMany({ postId });

      res.status(200).json({ status: HTTPStatusText.SUCCESS, data: comments });
    } catch (err: any) {
      next(err);
    }
  }

  static async get(_req: Request, res: Response, next: NextFunction) {
    try {
      const { postId, id } = res.locals.params as IdParams;
      const comment = await CommentService.get({ postId, id });

      res.status(200).json({ status: HTTPStatusText.SUCCESS, data: comment });
    } catch (err: any) {
      next(err);
    }
  }

  static async create(_req: Request, res: Response, next: NextFunction) {
    try {
      const { postId } = res.locals.params as PostIdParams;
      const { content } = res.locals.body as ContentBody;

      const comment = await CommentService.create({ postId, userId: res.locals.user.id, content });

      res.status(201).json({ status: HTTPStatusText.SUCCESS, data: comment });
    } catch (err: any) {
      next(err);
    }
  }

  static async update(_req: Request, res: Response, next: NextFunction) {
    try {
      const { postId, id } = res.locals.params as IdParams;
      const { content } = res.locals.body as ContentBody;

      const comment = await CommentService.update({ postId, id, userId: res.locals.user.id, content });

      res.status(200).json({ status: HTTPStatusText.SUCCESS, data: comment });
    } catch (err: any) {
      next(err);
    }
  }

  static async delete(_req: Request, res: Response, next: NextFunction) {
    try {
      const { postId, id } = res.locals.params as IdParams;
      await CommentService.delete({ postId, id });

      res.status(200).json({ status: HTTPStatusText.SUCCESS, message: SuccessMessages.COMMENT_DELETED });
    } catch (err: any) {
      next(err);
    }
  }

  static async count(_req: Request, res: Response, next: NextFunction) {
    try {
      const { postId } = res.locals.params as PostIdParams;
      const count = await CommentService.count({ postId });

      res.status(200).json({ status: HTTPStatusText.SUCCESS, data: { count } });
    } catch (err: any) {
      next(err);
    }
  }
}
