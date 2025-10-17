import { Request, Response } from "express";
import prisma from "../config/db";

export default async function checkCourseExists(req: Request, res: Response, next: Function) {
  const { courseId } = req.params;
  try {
    const room = await prisma.course.findUnique({ where: { id: parseInt(courseId) } });
    if (!room) return res.status(404).json({ status: "fail", message: "Room not found" });
    next();
  } catch (err) {
    console.log((err as Error).message);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}
