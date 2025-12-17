import { Role } from "../../generated/prisma/client";
import { Request, Response } from "express";
import prisma from "../../config/db";

export async function getRooms(req: Request, res: Response) {
  const { search } = req.query;
  try {
    if (search) {
      const rooms = await prisma.course.findMany({
        where: {
          OR: [
            { name: { contains: String(search), mode: "insensitive" } },
            { description: { contains: String(search), mode: "insensitive" } },
          ],
        },
      });
      return res.status(200).json({ status: "success", data: rooms });
    }
    const rooms = await prisma.course.findMany();
    res.status(200).json({ status: "success", data: rooms });
  } catch (err) {
    console.log((err as Error).message);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function getRoomById(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const room = await prisma.course.findFirst({ where: { id } });
    if (!room) return res.status(404).json({ status: "fail", message: "Room not found" });
    res.status(200).json({ status: "success", data: room });
  } catch (err) {
    console.log((err as Error).message);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function createRoom(req: Request, res: Response) {
  const { name, description, trackId } = req.body;
  if (!name) return res.status(400).json({ status: "fail", message: "Course name is required" });
  if (!trackId) return res.status(400).json({ status: "fail", message: "Track id is required" });
  try {
    const userRooms = await prisma.course.findMany({ where: { createdBy: res.locals.user.id } });
    if (userRooms.some((room) => room.name === name))
      return res.status(400).json({ status: "fail", message: "Duplicate course name. Please choose another." });
    let newRoom;
    await prisma.$transaction(async (tx) => {
      newRoom = await tx.course.create({
        data: { name, description, trackId, createdBy: res.locals.user.id },
      });
      await tx.membership.create({
        data: { userId: res.locals.user.id, courseId: newRoom.id, roleInCourse: Role.INSTRUCTOR },
      });
    });
    res.status(201).json({ status: "success", data: newRoom });
  } catch (err) {
    console.log((err as Error).message);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function updateRoom(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const room = await prisma.course.findFirst({ where: { id } });
    if (!room) return res.status(404).json({ status: "fail", message: "Room not found" });
    const { name, description } = req.body;
    const updatedData: any = {};
    if (name) updatedData.name = name;
    if (description) updatedData.description = description;
    const userRooms = await prisma.course.findMany({ where: { createdBy: res.locals.user.id } });
    if (userRooms.some((room) => room.name === name))
      return res.status(400).json({ status: "fail", message: "Duplicate course name. Please choose another." });
    const updatedRoom = await prisma.course.update({
      where: { id },
      data: updatedData,
    });
    res.status(200).json({ status: "success", data: updatedRoom });
  } catch (err) {
    console.log((err as Error).message);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function deleteRoom(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const room = await prisma.course.findFirst({ where: { id } });
    if (!room) return res.status(404).json({ status: "fail", message: "Room not found" });
    await prisma.course.delete({ where: { id } });
    res.status(200).json({ status: "success", message: "Room deleted successfully" });
  } catch (err) {
    console.log((err as Error).message);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}
