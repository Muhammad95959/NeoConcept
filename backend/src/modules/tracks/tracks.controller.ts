import { Request, Response } from "express";
import prisma from "../../config/db";
import { Role } from "../../generated/prisma";
import safeUserData from "../../utils/safeUserData";

export async function getTracks(req: Request, res: Response) {
  try {
    const { search } = req.query;
    const where: any = { deletedAt: null };
    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: "insensitive" } },
        { description: { contains: String(search), mode: "insensitive" } },
      ];
    }
    const tracks = await prisma.track.findMany({ where, include: { courses: true } });
    res.status(200).json({ status: "success", data: tracks });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function getTrackById(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };
    const track = await prisma.track.findFirst({ where: { id, deletedAt: null }, include: { courses: true } });
    if (!track) return res.status(404).json({ status: "fail", message: "Track not found" });
    res.status(200).json({ status: "success", data: track });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function getTrackStaff(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };
    const staff = await prisma.user.findMany({
      where: { currentTrackId: id, role: { in: [Role.INSTRUCTOR, Role.ASSISTANT] }, deletedAt: null },
    });
    const safeStaffData = staff
      .filter((user) => user.emailConfirmed === true)
      .map((user) => {
        return { ...safeUserData(user), googleId: undefined, emailConfirmed: undefined, deletedAt: undefined };
      });
    res.status(200).json({ status: "success", data: safeStaffData });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function createTrack(req: Request, res: Response) {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ status: "fail", message: "Track name is required" });
    if (res.locals.user.currentTrackId)
      return res.status(400).json({ status: "fail", message: "This account is already assigned to a track" });
    const duplicate = await prisma.track.findFirst({
      where: { deletedAt: null, name: { equals: name, mode: "insensitive" } },
    });
    if (duplicate)
      return res.status(400).json({ status: "fail", message: "Duplicate track name. Please choose another." });
    let newTrack;
    await prisma.$transaction(async (tx) => {
      newTrack = await tx.track.create({
        data: { name: name.trim(), description: description?.trim(), creatorId: res.locals.user.id },
      });
      await tx.user.update({ where: { id: res.locals.user.id }, data: { currentTrackId: newTrack.id } });
      await tx.userTrack.create({
        data: { userId: res.locals.user.id, trackId: newTrack.id },
      });
    });
    res.status(201).json({ status: "success", data: newTrack });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function updateTrack(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };
    const { name, description } = req.body;
    if (!name?.trim() && !description?.trim())
      return res.status(400).json({ status: "fail", message: "Track name or description is required" });
    const track = await prisma.track.findFirst({ where: { id, deletedAt: null } });
    if (!track) return res.status(404).json({ status: "fail", message: "Track not found" });
    const duplicate = await prisma.track.findFirst({
      where: { deletedAt: null, name: { equals: name, mode: "insensitive" }, NOT: { id } },
    });
    if (duplicate)
      return res.status(400).json({ status: "fail", message: "Duplicate track name. Please choose another." });
    const data: any = {};
    if (name) data.name = name.trim();
    if (description) data.description = description.trim();
    const updatedTrack = await prisma.track.update({ where: { id }, data });
    res.status(200).json({ status: "success", data: updatedTrack });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function deleteTrack(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };
    const track = await prisma.track.findFirst({ where: { id, deletedAt: null } });
    if (!track) return res.status(404).json({ status: "fail", message: "Track not found" });
    await prisma.track.update({ where: { id }, data: { deletedAt: new Date() } });
    res.status(200).json({ status: "success", message: "Track deleted successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}
