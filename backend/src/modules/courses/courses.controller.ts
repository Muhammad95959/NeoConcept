import { Request, Response } from "express";
import prisma from "../../config/db";

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
    const courses = await prisma.course.findMany({ where, include: { track: true } });
    res.status(200).json({ status: "success", data: courses });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function getCourseById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const course = await prisma.course.findFirst({ where: { id, deletedAt: null }, include: { track: true } });
    if (!course) return res.status(404).json({ status: "fail", message: "Course not found" });
    res.status(200).json({ status: "success", data: course });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function createCourse(req: Request, res: Response) {
  try {
    const { name, description, trackId } = req.body;
    if (!name) return res.status(400).json({ status: "fail", message: "Course name is required" });
    if (!trackId) return res.status(400).json({ status: "fail", message: "Track id is required" });
    const track = await prisma.track.findFirst({ where: { id: trackId, deletedAt: null } });
    if (!track) return res.status(404).json({ status: "fail", message: "Track not found" });
    const duplicate = await prisma.course.findFirst({
      where: { trackId, deletedAt: null, name: { equals: name, mode: "insensitive" } },
    });
    if (duplicate)
      return res.status(400).json({ status: "fail", message: "Duplicate course name. Please choose another." });
    const newCourse = await prisma.course.create({ data: { name, description, trackId } });
    res.status(201).json({ status: "success", data: newCourse });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function updateCourse(req: Request, res: Response) {
  try {
    const { id } = req.params;
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

export async function deleteCourse(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const course = await prisma.course.findFirst({ where: { id, deletedAt: null } });
    if (!course) return res.status(404).json({ status: "fail", message: "Course not found" });
    await prisma.course.update({ where: { id }, data: { deletedAt: new Date() } });
    res.status(200).json({ status: "success", message: "Course deleted successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}
