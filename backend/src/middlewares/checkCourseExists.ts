import { Request, Response } from "express";
import prisma from "../config/db";
import { HTTPStatusText } from "../types/HTTPStatusText";
import { ErrorMessages } from "../types/errorsMessages";

export default async function checkCourseExists(req: Request, res: Response, next: Function) {
  const { courseId } = req.params as { courseId: string };
  try {
    const course = await prisma.course.findFirst({ where: { id: courseId, deletedAt: null } });
    if (!course) return res.status(404).json({ status: HTTPStatusText.FAIL, message: ErrorMessages.COURSE_NOT_FOUND });
    next();
  } catch (err) {
    res.status(500).json({ status: HTTPStatusText.ERROR, message: ErrorMessages.SOMETHING_WENT_WRONG });
  }
}
