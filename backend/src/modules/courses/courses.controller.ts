import { Request, Response } from "express";
import prisma from "../../config/db";
import { Role } from "../../generated/prisma";

export async function getCourses(req: Request, res: Response) {
  try {
    const { search } = req.query;
    const where: any = { deletedAt: null };
    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: "insensitive" } },
        { description: { contains: String(search), mode: "insensitive" } },
      ];
    }
    const courses = await prisma.course.findMany({ where, include: { track: true, courseUsers: true } });
    const data = courses.map((course) => {
      return { ...course, staff: course.courseUsers, courseUsers: undefined };
    });
    res.status(200).json({ status: "success", data });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function getCourseById(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };
    const course = await prisma.course.findFirst({
      where: { id, deletedAt: null },
      include: { track: true, courseUsers: true },
    });
    if (!course) return res.status(404).json({ status: "fail", message: "Course not found" });
    const data = { ...course, staff: course.courseUsers, courseUsers: undefined };
    res.status(200).json({ status: "success", data });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function createCourse(req: Request, res: Response) {
  try {
    const { name, description, trackId, instructorIds, assistantIds } = req.body;
    if (!name) return res.status(400).json({ status: "fail", message: "Course name is required" });
    if (!trackId) return res.status(400).json({ status: "fail", message: "Track id is required" });
    if (instructorIds && !Array.isArray(instructorIds))
      return res.status(400).json({ status: "fail", message: "Instructor ids must be an array" });
    if (assistantIds && !Array.isArray(assistantIds))
      return res.status(400).json({ status: "fail", message: "Assistant ids must be an array" });
    const track = await prisma.track.findFirst({ where: { id: trackId, deletedAt: null } });
    let instructors: any[] = [];
    if (instructorIds && instructorIds.length > 0)
      instructors = await prisma.user.findMany({ where: { id: { in: instructorIds } } });
    if (instructors.length !== instructorIds.length)
      return res.status(400).json({ status: "fail", message: "One or more instructorIds are invalid" });
    if (instructors.some((user) => user.role !== Role.INSTRUCTOR))
      return res
        .status(400)
        .json({ status: "fail", message: "One or more users in instructorIds is not an instructor" });
    if (instructors.some((user) => user.currentTrackId !== trackId))
      return res
        .status(400)
        .json({ status: "fail", message: "One or more instructors is not assigned to the specified track" });
    let assistants: any[] = [];
    if (assistantIds && assistantIds.length > 0)
      assistants = await prisma.user.findMany({ where: { id: { in: assistantIds } } });
    if (assistants.length !== assistantIds.length)
      return res.status(400).json({ status: "fail", message: "One or more assistantIds are invalid" });
    if (assistants.some((user) => user.role !== Role.ASSISTANT))
      return res.status(400).json({ status: "fail", message: "One or more users in assistantIds is not an assistant" });
    if (assistants.some((user) => user.currentTrackId !== trackId))
      return res
        .status(400)
        .json({ status: "fail", message: "One or more assistants is not assigned to the specified track" });
    if (!track) return res.status(404).json({ status: "fail", message: "Track not found" });
    const duplicate = await prisma.course.findFirst({
      where: { trackId, deletedAt: null, name: { equals: name, mode: "insensitive" } },
    });
    if (duplicate)
      return res.status(400).json({ status: "fail", message: "Duplicate course name. Please choose another." });
    let newCourse: any;
    await prisma.$transaction(async (tx) => {
      newCourse = await tx.course.create({ data: { name, description, trackId } });
      let instructorsData: any[] = [];
      if (instructorIds && instructorIds.length > 0)
        instructorsData = instructorIds.map((id: string) => {
          return { courseId: newCourse.id, userId: id, roleInCourse: Role.INSTRUCTOR };
        });
      let assistantsData: any[] = [];
      if (assistantIds && assistantIds.length > 0)
        assistantsData = assistantIds.map((id: string) => {
          return { courseId: newCourse.id, userId: id, roleInCourse: Role.ASSISTANT };
        });
      const data = [...instructorsData, ...assistantsData];
      await tx.userCourse.createMany({ data });
    });
    res.status(201).json({ status: "success", data: newCourse });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function updateCourse(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };
    const { name, description } = req.body;
    const course = await prisma.course.findFirst({ where: { id, deletedAt: null } });
    if (!course) return res.status(404).json({ status: "fail", message: "Course not found" });
    if (!name?.trim() && !description?.trim())
      return res.status(400).json({ status: "fail", message: "Course name or description is required" });
    const data: any = {};
    if (name) data.name = name.trim();
    if (description) data.description = description.trim();
    const duplicate = await prisma.course.findFirst({
      where: { trackId: course.trackId, deletedAt: null, name: { equals: name, mode: "insensitive" }, NOT: { id } },
    });
    if (duplicate)
      return res.status(400).json({ status: "fail", message: "Duplicate course name. Please choose another." });
    const updatedCourse = await prisma.course.update({ where: { id }, data });
    res.status(200).json({ status: "success", data: updatedCourse });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function updateCourseStaff(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };
    const { trackId, instructorIds, assistantIds } = req.body;
    if (!trackId) return res.status(400).json({ status: "fail", message: "Track id is required" });
    const course = await prisma.course.findFirst({ where: { id, deletedAt: null } });
    if (!course) return res.status(404).json({ status: "fail", message: "Course not found" });
    if (instructorIds && !Array.isArray(instructorIds))
      return res.status(400).json({ status: "fail", message: "Instructor ids must be an array" });
    if (assistantIds && !Array.isArray(assistantIds))
      return res.status(400).json({ status: "fail", message: "Assistant ids must be an array" });
    let instructors: any[] = [];
    if (instructorIds && instructorIds.length > 0)
      instructors = await prisma.user.findMany({ where: { id: { in: instructorIds } } });
    if (instructors.length !== instructorIds.length)
      return res.status(400).json({ status: "fail", message: "One or more instructorIds are invalid" });
    if (instructors.some((user) => user.role !== Role.INSTRUCTOR))
      return res
        .status(400)
        .json({ status: "fail", message: "One or more users in instructorIds is not an instructor" });
    if (instructors.some((user) => user.currentTrackId !== trackId))
      return res
        .status(400)
        .json({ status: "fail", message: "One or more instructors is not assigned to the specified track" });
    let assistants: any[] = [];
    if (assistantIds && assistantIds.length > 0)
      assistants = await prisma.user.findMany({ where: { id: { in: assistantIds } } });
    if (assistants.length !== assistantIds.length)
      return res.status(400).json({ status: "fail", message: "One or more assistantIds are invalid" });
    if (assistants.some((user) => user.role !== Role.ASSISTANT))
      return res.status(400).json({ status: "fail", message: "One or more users in assistantIds is not an assistant" });
    if (assistants.some((user) => user.currentTrackId !== trackId))
      return res
        .status(400)
        .json({ status: "fail", message: "One or more assistants is not assigned to the specified track" });
    await prisma.$transaction(async (tx) => {
      await tx.userCourse.deleteMany({ where: { courseId: id } });
      let instructorsData: any[] = [];
      if (instructorIds && instructorIds.length > 0)
        instructorsData = instructorIds.map((id: string) => {
          return { courseId: course.id, userId: id, roleInCourse: Role.INSTRUCTOR };
        });
      let assistantsData: any[] = [];
      if (assistantIds && assistantIds.length > 0)
        assistantsData = assistantIds.map((id: string) => {
          return { courseId: course.id, userId: id, roleInCourse: Role.ASSISTANT };
        });
      const data = [...instructorsData, ...assistantsData];
      await tx.userCourse.createMany({ data });
    });
    res.status(200).json({ status: "success", message: "Course staff updated successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function deleteCourse(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };
    const course = await prisma.course.findFirst({ where: { id, deletedAt: null } });
    if (!course) return res.status(404).json({ status: "fail", message: "Course not found" });
    await prisma.course.update({ where: { id }, data: { deletedAt: new Date() } });
    res.status(200).json({ status: "success", message: "Course deleted successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}
