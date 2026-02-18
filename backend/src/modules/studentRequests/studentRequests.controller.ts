import { Request, Response } from "express";
import prisma from "../../config/db";
import { Role, Status } from "../../generated/prisma";

export async function getCourseStudentRequests(req: Request, res: Response) {
  try {
    const { courseId, status } = req.query as { courseId?: string; status?: string };
    if (!courseId) return res.status(400).json({ status: "fail", message: "Course id is required" });
    if (status && !Object.values(Status).includes(status.toUpperCase() as Status))
      return res.status(400).json({ status: "fail", message: "Invalid status" });
    const user = res.locals.user;
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return res.status(404).json({ status: "fail", message: "Course not found" });
    const isStaff = await prisma.userCourse.findFirst({
      where: { courseId, userId: user.id, roleInCourse: { in: [Role.INSTRUCTOR, Role.ASSISTANT] } },
    });
    if (!isStaff) return res.status(403).json({ status: "fail", message: "You're not a staff member of this course" });
    const requests = await prisma.studentRequest.findMany({
      where: { courseId, status: status?.toUpperCase() as Status | undefined },
    });
    res.status(200).json({ status: "success", data: requests });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function getCourseStudentRequestById(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };
    const user = res.locals.user;
    const request = await prisma.studentRequest.findUnique({ where: { id } });
    if (!request) return res.status(404).json({ status: "fail", message: "Student request not found" });
    const isStaff = await prisma.userCourse.findFirst({
      where: { courseId: request.courseId, userId: user.id, roleInCourse: { in: [Role.INSTRUCTOR, Role.ASSISTANT] } },
    });
    if (!isStaff) return res.status(403).json({ status: "fail", message: "You're not a staff member of this course" });
    res.status(200).json({ status: "success", data: request });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function createStudentRequest(req: Request, res: Response) {
  try {
    const { courseId } = req.body as { courseId: string };
    if (!courseId) return res.status(400).json({ status: "fail", message: "Course id is required" });
    const user = res.locals.user;
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return res.status(404).json({ status: "fail", message: "Course not found" });
    const isEnrolled = await prisma.userCourse.findFirst({ where: { courseId, userId: user.id } });
    if (isEnrolled) return res.status(400).json({ status: "fail", message: "You're already enrolled in this course" });
    if (!course.protected)
      return res
        .status(400)
        .json({ status: "fail", message: "This course is not protected, you can join it directly" });
    const existingRequest = await prisma.studentRequest.findFirst({ where: { courseId, userId: user.id } });
    if (existingRequest)
      return res.status(400).json({ status: "fail", message: "You have already submitted a request for this course" });
    const newRequest = await prisma.studentRequest.create({ data: { courseId, userId: user.id } });
    res.status(201).json({ status: "success", data: newRequest });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function answerStudentRequest(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };
    const { status } = req.body;
    const user = res.locals.user;
    if (status !== Status.APPROVED && status !== Status.REJECTED)
      return res.status(400).json({ status: "fail", message: "Invalid status" });
    const request = await prisma.studentRequest.findUnique({ where: { id } });
    if (!request) return res.status(404).json({ status: "fail", message: "Request not found" });
    if (request.status !== Status.PENDING)
      return res.status(400).json({ status: "fail", message: "Request already answered" });
    const isStaff = await prisma.userCourse.findFirst({
      where: { courseId: request.courseId, userId: user.id, roleInCourse: { in: [Role.INSTRUCTOR, Role.ASSISTANT] } },
    });
    if (!isStaff) return res.status(403).json({ status: "fail", message: "You're not a staff member of this course" });
    await prisma.$transaction(async (tx) => {
      await tx.studentRequest.update({ where: { id }, data: { status } });
      if (status === Status.APPROVED) {
        await tx.userCourse.create({
          data: { userId: request.userId, courseId: request.courseId, roleInCourse: Role.STUDENT },
        });
      }
    });
    res.status(200).json({ status: "success", message: `Request ${status.toLowerCase()} successfully` });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function deleteStudentRequest(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };
    const user = res.locals.user;
    const request = await prisma.studentRequest.findUnique({ where: { id } });
    if (!request) return res.status(404).json({ status: "fail", message: "Request not found" });
    if (request.userId !== user.id)
      return res.status(403).json({ status: "fail", message: "You can only delete your own requests" });
    if (request.status !== Status.PENDING)
      return res.status(400).json({ status: "fail", message: "Only pending requests can be deleted" });
    await prisma.studentRequest.delete({ where: { id } });
    res.status(200).json({ status: "success", message: "Request deleted successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}
