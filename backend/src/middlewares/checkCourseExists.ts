import { Request, Response } from "express";
import prisma from "../config/db";
import { HttpStatusText } from "../types/HTTPStatusText";

export default async function checkCourseExists(req: Request, res: Response, next: Function) {
  const { courseId } = req.params as { courseId: string };
  try {
    const course = await prisma.course.findFirst({ where: { id: courseId, deletedAt: null } });
    if (!course) return res.status(404).json({ status: HttpStatusText.FAIL, message: "Course not found" });
    next();
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: HttpStatusText.ERROR, message: "Something went wrong" });
  }
}
