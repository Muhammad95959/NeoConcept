import { Request, Response } from "express";
import { Status, User } from "../../generated/prisma";
import prisma from "../../config/db";

export async function getRequests(req: Request, res: Response) {
  try {
    const requests = await prisma.request.findMany({
      where: { user: { deletedAt: null, currentTrackId: res.locals.user.currentTrackId } },
      include: { user: true, course: true },
    });
    res.status(200).json({ status: "success", data: requests });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function getRequestById(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };
    const request = await prisma.request.findUnique({
      where: { id, user: { deletedAt: null } },
      include: { user: true, course: true },
    });
    if (!request) return res.status(404).json({ status: "fail", message: "Request not found" });
    res.status(200).json({ status: "success", data: request });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function createRequest(req: Request, res: Response) {
  try {
    const user: User = res.locals.user;
    const { courseId, message } = req.body;
    if (!courseId) return res.status(400).json({ status: "fail", message: "Course ID is required" });
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return res.status(404).json({ status: "fail", message: "Course not found" });
    const existingRequest = await prisma.request.findFirst({
      where: { userId: user.id, courseId, status: Status.PENDING },
    });
    if (existingRequest)
      return res.status(400).json({ status: "fail", message: "You already have a pending request for this course" });
    const newRequest = await prisma.request.create({ data: { userId: user.id, courseId, message } });
    res.status(201).json({ status: "success", data: newRequest });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function updateRequest(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };
    const { message } = req.body;
    if (!message) return res.status(400).json({ status: "fail", message: "Provide the new message" });
    const request = await prisma.request.findUnique({ where: { id } });
    if (!request) return res.status(404).json({ status: "fail", message: "Request not found" });
    if (request.userId !== res.locals.user.id)
      return res.status(401).json({ status: "fail", message: "You can only update your own requests" });
    if (request.status !== Status.PENDING)
      return res.status(400).json({ status: "fail", message: "Only pending requests can be updated" });
    const updatedRequest = await prisma.request.update({ where: { id }, data: { message } });
    res.status(200).json({ status: "success", data: updatedRequest });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function answerRequest(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };
    const { status } = req.body;
    if (![Status.APPROVED, Status.REJECTED].includes(status.toUpperCase()))
      return res.status(400).json({ status: "fail", message: "Invalid status" });
    const request = await prisma.request.findUnique({ where: { id }, include: { user: true, course: true } });
    if (!request) return res.status(404).json({ status: "fail", message: "Request not found" });
    if (request.status !== Status.PENDING)
      return res.status(400).json({ status: "fail", message: "Request already answered" });
    await prisma.$transaction(async (tx) => {
      await tx.request.update({ where: { id }, data: { status } });
      if (status === Status.APPROVED) {
        await tx.userCourse.create({
          data: { userId: request.userId, courseId: request.courseId, roleInCourse: request.user.role },
        });
      }
    });
    res.status(200).json({ status: "success", message: `Request ${status.toLowerCase()} successfully` });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function deleteRequest(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };
    const request = await prisma.request.findUnique({ where: { id } });
    if (!request) return res.status(404).json({ status: "fail", message: "Request not found" });
    if (request.userId !== res.locals.user.id)
      return res.status(401).json({ status: "fail", message: "You can only delete your own requests" });
    if (request.status !== Status.PENDING)
      return res.status(400).json({ status: "fail", message: "Only pending requests can be deleted" });
    await prisma.request.delete({ where: { id } });
    res.status(200).json({ status: "success", message: "Request deleted successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}
