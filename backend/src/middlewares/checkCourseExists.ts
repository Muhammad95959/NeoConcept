import { Request, Response } from "express";
import prisma from "../config/db";

export default async function checkCourseExists(req: Request, res: Response, next: Function) {
  const { courseId } = req.params;
  try {
    const course = await prisma.course.findFirst({ where: { id: courseId, deletedAt: null } });
    if (!course) return res.status(404).json({ status: "fail", message: "Course not found" });
    next();
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}
