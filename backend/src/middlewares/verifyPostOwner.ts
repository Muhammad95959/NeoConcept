import { Request, Response, NextFunction } from "express";
import prisma from "../config/db";
import { HTTPStatusText } from "../types/HTTPStatusText";
import { ErrorMessages } from "../types/errorsMessages";

export default async function verifyPostOwner(req: Request, res: Response, next: NextFunction) {
  try {
    const { courseId, id } = req.params as { courseId: string; id: string };
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post || post.courseId !== courseId)
      return res.status(404).json({ status: HTTPStatusText.FAIL, message: ErrorMessages.POST_NOT_FOUND });
    if (post.uploadedBy !== res.locals.user.id)
      return res.status(403).json({ status: HTTPStatusText.FAIL, message: ErrorMessages.NOT_POST_OWNER });
    next();
  } catch (err) {
    return res.status(500).json({ status: HTTPStatusText.FAIL, message: ErrorMessages.SOMETHING_WENT_WRONG });
  }
}
