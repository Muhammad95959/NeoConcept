import { Request, Response } from "express";
import prisma from "../config/db";
import { HTTPStatusText } from "../types/HTTPStatusText";
import { ErrorMessages } from "../types/errorsMessages";

export default async function verifyCourseMember(req: Request, res: Response, next: Function) {
  const { courseId } = req.params as { courseId: string };
  try {
    const membership = await prisma.userCourse.findUnique({
      where: { userId_courseId: { userId: res.locals.user.id, courseId } },
    });
    if (!membership)
      return res.status(403).json({ status: HTTPStatusText.FAIL, message: ErrorMessages.NOT_A_MEMBER_OF_COURSE });
    next();
  } catch (err) {
    res.status(500).json({ status: HTTPStatusText.FAIL, message: ErrorMessages.SOMETHING_WENT_WRONG });
  }
}
