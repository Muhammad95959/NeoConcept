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
        { shortDescription: { contains: String(search), mode: "insensitive" } },
        { longDescription: { contains: String(search), mode: "insensitive" } },
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
    const {
      name,
      shortDescription,
      longDescription,
      domain,
      level,
      language,
      targetAudience,
      learningOutcomes,
      relatedJobs,
      pricingModel,
    } = req.body;
    if (!name) return res.status(400).json({ status: "fail", message: "Track name is required" });
    if (learningOutcomes && !Array.isArray(learningOutcomes))
      return res.status(400).json({ status: "fail", message: "Learning outcomes must be an array of strings" });
    if (relatedJobs && !Array.isArray(relatedJobs))
      return res.status(400).json({ status: "fail", message: "Related jobs must be an array of strings" });
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
        data: {
          relatedJobs,
          learningOutcomes,
          name: name.trim(),
          shortDescription: shortDescription.trim(),
          longDescription: longDescription.trim(),
          domain: domain.trim(),
          level: level.trim(),
          language: language.trim(),
          targetAudience: targetAudience.trim(),
          pricingModel: pricingModel.trim(),
          creatorId: res.locals.user.id,
        },
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
    const {
      name,
      shortDescription,
      longDescription,
      domain,
      level,
      language,
      targetAudience,
      learningOutcomes,
      relatedJobs,
      pricingModel,
    } = req.body;

    if (learningOutcomes && !Array.isArray(learningOutcomes))
      return res.status(400).json({ status: "fail", message: "Learning outcomes must be an array of strings" });
    if (relatedJobs && !Array.isArray(relatedJobs))
      return res.status(400).json({ status: "fail", message: "Related jobs must be an array of strings" });

    if (
      !name?.trim() &&
      !shortDescription?.trim() &&
      !longDescription?.trim() &&
      !domain?.trim() &&
      !level?.trim() &&
      !language?.trim() &&
      !targetAudience?.trim() &&
      (!learningOutcomes || learningOutcomes.length === 0) &&
      (!relatedJobs || relatedJobs.length === 0) &&
      !pricingModel?.trim()
    )
      return res.status(400).json({ status: "fail", message: "You didn't provide any field to update" });
    const track = await prisma.track.findFirst({ where: { id, deletedAt: null } });
    if (!track) return res.status(404).json({ status: "fail", message: "Track not found" });
    const duplicate = await prisma.track.findFirst({
      where: { deletedAt: null, name: { equals: name, mode: "insensitive" }, NOT: { id } },
    });
    if (duplicate)
      return res.status(400).json({ status: "fail", message: "Duplicate track name. Please choose another." });
    const data: any = {};
    if (name) data.name = name.trim();
    if (shortDescription) data.shortDescription = shortDescription.trim();
    if (longDescription) data.longDescription = longDescription.trim();
    if (domain) data.domain = domain.trim();
    if (level) data.level = level.trim();
    if (language) data.language = language.trim();
    if (targetAudience) data.targetAudience = targetAudience.trim();
    if (learningOutcomes) data.learningOutcomes = learningOutcomes;
    if (relatedJobs) data.relatedJobs = relatedJobs;
    if (pricingModel) data.pricingModel = pricingModel.trim();
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
