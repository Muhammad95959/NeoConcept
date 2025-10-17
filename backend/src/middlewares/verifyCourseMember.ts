import { Request, Response } from "express";
import prisma from "../config/db";

export default async function verifyCourseMember(req: Request, res: Response, next: Function) {
  const { courseId } = req.params;
  try {
    const membership = await prisma.memberShip.findFirst({
      where: { courseId: parseInt(courseId), userId: parseInt(res.locals.user.id) },
    });
    if (!membership) res.status(403).json({ status: "fail", message: "You are not a member of this course" });
    next();
  } catch (err) {
    console.log((err as Error).message);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}
