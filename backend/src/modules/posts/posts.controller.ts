import { NextFunction, Request, Response } from "express";
import { PostService } from "./posts.service";
import { HttpStatusText } from "../../types/HTTPStatusText";
import { CourseIdParam, CreatePostInput, GetPostsQuery, PostIdParam } from "./posts.validation";

export class PostsController {
  static async getPosts(req: Request, res: Response, next: NextFunction) {
    try {
      const { courseId } = req.validated!.params as CourseIdParam;
      const { search } = req.validated!.query as GetPostsQuery;

      const posts = await PostService.getPosts({ courseId, search: String(search || "") });

      res.status(200).json({ status: HttpStatusText.SUCCESS, data: posts });
    } catch (err: any) {
      next(err);
    }
  }
  static async getPost(req: Request, res: Response, next: NextFunction) {
    try {
      const { courseId, id } = req.validated!.params as PostIdParam;

      const post = await PostService.getPost({ courseId, id });

      res.status(200).json({ status: HttpStatusText.SUCCESS, data: post });
    } catch (err: any) {
      next(err);
    }
  }
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { courseId } = req.validated!.params as CourseIdParam;
      const { title, content } = req.validated!.body as CreatePostInput;

      const post = await PostService.create({ courseId, userId: res.locals.user.id, title, content });

      res.status(201).json({ status: HttpStatusText.SUCCESS, data: post });
    } catch (err: any) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { courseId, id } = req.validated!.params as PostIdParam;
      const { title, content } = req.validated!.body as CreatePostInput;

      const post = await PostService.update({ courseId, id, userId: res.locals.user.id, title, content });

      res.status(200).json({ status: HttpStatusText.SUCCESS, data: post });
    } catch (err: any) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { courseId, id } = req.validated!.params as PostIdParam;

      await PostService.delete({ courseId, id, userId: res.locals.user.id });

      res.status(200).json({
        status: HttpStatusText.SUCCESS,
        message: "Post deleted successfully",
      });
    } catch (err: any) {
      next(err);
    }
  }
}
