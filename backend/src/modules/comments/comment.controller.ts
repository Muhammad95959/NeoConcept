import { Request, Response, NextFunction } from "express";
import { ContentBody, CoursePostParams, IdParams } from "./comment.validation";
import { CommentService } from "./comment.service";
import { HTTPStatusText } from "../../types/HTTPStatusText";
import { ErrorMessages } from "../../types/errorsMessages";
import { SuccessMessages } from "../../types/successMessages";

export class CommentController {
  static async getMany(_req: Request, res: Response, next: NextFunction) {
    try {
      const { courseId, postId } = res.locals.params as CoursePostParams;
      const comments = await CommentService.getMany({ courseId, postId });

      res.status(200).json({ status: HTTPStatusText.SUCCESS, data: comments });
    } catch (err: any) {
      next(err);
    }
  }

  static async get(_req: Request, res: Response, next: NextFunction) {
    try {
      const { courseId, postId, id } = res.locals.params as IdParams;
      const comment = await CommentService.get({ courseId, postId, id });
      
      res.status(200).json({ status: HTTPStatusText.SUCCESS, data: comment });
    } catch (err: any) {
      next(err);
    }
  }

  static async create(_req: Request, res: Response, next: NextFunction) {
    try {
      const { courseId, postId } = res.locals.params as CoursePostParams;
      const { content } = res.locals.body as ContentBody;
      
      const comment = await CommentService.create({ courseId, postId, userId: res.locals.user.id, content });

      res.status(201).json({ status: HTTPStatusText.SUCCESS, data: comment });
    } catch (err: any) {
      next(err);
    }
  }

  static async update(_req: Request, res: Response, next: NextFunction) {
    try {
      const { courseId, postId, id } = res.locals.params as IdParams;
      const { content } = res.locals.body as ContentBody;
      
      const comment = await CommentService.update({ courseId, postId, id, userId: res.locals.user.id, content });

      res.status(200).json({ status: HTTPStatusText.SUCCESS, data: comment });
    } catch (err: any) {
      next(err);
    }
  }

  static async delete(_req: Request, res: Response, next: NextFunction) {
    try {
      const { courseId, postId, id } = res.locals.params as IdParams;
      await CommentService.delete({ courseId, postId, id });
      
      res.status(200).json({ status: HTTPStatusText.SUCCESS, message: SuccessMessages.COMMENT_DELETED });
    } catch (err: any) {
      next(err);
    }
  }
}
