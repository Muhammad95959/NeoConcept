import { NextFunction, Request, Response } from "express";
import { PostService } from "./posts.service";
import { HttpStatusText } from "../../types/HTTPStatusText";

export async function getPosts(req: Request, res: Response, next: NextFunction) {
  try {
    const { courseId } = req.validated!.params;
    const { search } = req.validated!.query;

    const posts = await PostService.getPosts(courseId, String(search || ""));

    res.status(200).json({ status: HttpStatusText.SUCCESS, data: posts });
  } catch (err: any) {
    next(err);
  }
}

export async function getPostById(req: Request, res: Response, next: NextFunction) {
  try {
    const { courseId, id } = req.validated!.params;

    const post = await PostService.getPostById(courseId, id);

    res.status(200).json({ status: HttpStatusText.SUCCESS, data: post });
  } catch (err: any) {
    next(err);
  }
}

export async function createPost(req: Request, res: Response, next: NextFunction) {
  try {
    const { courseId } = req.validated!.params;
    const { title, content } = req.validated!.body;

    const post = await PostService.createPost(courseId, res.locals.user.id, title, content);

    res.status(201).json({ status: HttpStatusText.SUCCESS, data: post });
  } catch (err: any) {
    next(err);
  }
}

export async function updatePost(req: Request, res: Response, next: NextFunction) {
  try {
    const { courseId, id } = req.validated!.params;
    const { title, content } = req.validated!.body;

    const post = await PostService.updatePost(courseId, id, res.locals.user.id, title, content);

    res.status(200).json({ status: HttpStatusText.SUCCESS, data: post });
  } catch (err: any) {
    next(err);
  }
}

export async function deletePost(req: Request, res: Response, next: NextFunction) {
  try {
    const { courseId, id } = req.validated!.params;

    await PostService.deletePost(courseId, id, res.locals.user.id);

    res.status(200).json({
      status: HttpStatusText.SUCCESS,
      message: "Post deleted successfully",
    });
  } catch (err: any) {
    next(err);
  }
}
