import prisma from "../../config/db";
import { Request, Response } from "express";

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
    const tracks = await prisma.track.findMany({ where });
    res.status(200).json({ status: "success", data: tracks });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function getTrackById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const track = await prisma.track.findFirst({ where: { id, deletedAt: null } });
    if (!track) return res.status(404).json({ status: "fail", message: "Track not found" });
    res.status(200).json({ status: "success", data: track });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function createTrack(req: Request, res: Response) {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ status: "fail", message: "Track name is required" });
    const duplicate = await prisma.track.findFirst({
      where: { deletedAt: null, name: { equals: name, mode: "insensitive" } },
    });
    if (duplicate)
      return res.status(400).json({ status: "fail", message: "Duplicate track name. Please choose another." });
    const newTrack = await prisma.track.create({ data: { name: name.trim(), description: description?.trim() } });
    res.status(201).json({ status: "success", data: newTrack });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function updateTrack(req: Request, res: Response) {
  try {
    const { id } = req.params;
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
    const { id } = req.params;
    const track = await prisma.track.findFirst({ where: { id, deletedAt: null } });
    if (!track) return res.status(404).json({ status: "fail", message: "Track not found" });
    await prisma.track.update({ where: { id }, data: { deletedAt: new Date() } });
    res.status(200).json({ status: "success", message: "Track deleted successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}
