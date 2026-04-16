import { NextFunction, Request, Response } from "express";
import { PostService } from "./post.service";
import { HTTPStatusText } from "../../types/HTTPStatusText";
import { CourseIdParams, CreateBody, GetManyQuery, GetByIdParams } from "./post.validation";
import { SuccessMessages } from "../../types/successMessages";

export class PostsController {
  static async getPosts(req: Request, res: Response, next: NextFunction) {
    try {
      const { courseId } = res.locals.params as CourseIdParams;
      const { search } = res.locals.query as GetManyQuery;

      const posts = await PostService.getPosts({ courseId, search: String(search || "") });

      res.status(200).json({ status: HTTPStatusText.SUCCESS, data: posts });
    } catch (err: any) {
      next(err);
    }
  }
  static async getPost(req: Request, res: Response, next: NextFunction) {
    try {
      const { courseId, id } = res.locals.params as GetByIdParams;

      const post = await PostService.getPost({ courseId, id });

      res.status(200).json({ status: HTTPStatusText.SUCCESS, data: post });
    } catch (err: any) {
      next(err);
    }
  }
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { courseId } = res.locals.params as CourseIdParams;
      const { title, content } = res.locals.body as CreateBody;

      const post = await PostService.create({ courseId, userId: res.locals.user.id, title, content });

      res.status(201).json({ status: HTTPStatusText.SUCCESS, data: post });
    } catch (err: any) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { courseId, id } = res.locals.params as GetByIdParams;
      const { title, content } = res.locals!.body as CreateBody;

      const post = await PostService.update({ courseId, id, userId: res.locals.user.id, title, content });

      res.status(200).json({ status: HTTPStatusText.SUCCESS, data: post });
    } catch (err: any) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { courseId, id } = res.locals!.params as GetByIdParams;

      await PostService.delete({ courseId, id, userId: res.locals.user.id });

      res.status(200).json({
        status: HTTPStatusText.SUCCESS,
        message: SuccessMessages.POST_DELETED,
      });
    } catch (err: any) {
      next(err);
    }
  }
}
