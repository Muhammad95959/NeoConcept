import { Request, Response, NextFunction } from "express";
import prisma from "../config/db";

export default async function verifyPostOwner(req: Request, res: Response, next: NextFunction) {
  try {
    const { courseId, id } = req.params as { courseId: string; id: string };
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post || post.courseId !== courseId) return res.status(404).json({ status: "fail", message: "Post not found" });
    if (post.uploadedBy !== res.locals.user.id)
      return res.status(403).json({ status: "fail", message: "You are not the owner of this post" });
    next();
  } catch (err) {
    console.log(err);
    return res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}
