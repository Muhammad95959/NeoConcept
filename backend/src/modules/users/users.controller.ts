import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import prisma from "../../config/db";

export async function updateUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { password, username } = req.body;
    if (id !== res.locals.user.id) return res.status(401).json({ status: "fail", message: "Unauthorized" });
    if (res.locals.user.deletedAt) return res.status(400).json({ status: "fail", message: "User not found" });
    if (!username?.trim() && !password)
      return res.status(400).json({ status: "fail", message: "Username or password is required" });
    const data: any = {};
    if (username?.trim()) data.username = username.trim();
    if (password) {
      data.password = await bcrypt.hash(password, 10);
      data.passwordChangedAt = new Date();
    }
    await prisma.user.update({ where: { id }, data });
    res.status(200).json({
      status: "success",
      message: password ? "Password updated. Please log in again." : "User updated successfully",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function deleteUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (id !== res.locals.user.id) return res.status(401).json({ status: "fail", message: "Unauthorized" });
    if (res.locals.user.deletedAt) return res.status(400).json({ status: "fail", message: "User not found" });
    await prisma.user.update({ where: { id }, data: { deletedAt: new Date() } });
    res.status(200).json({ status: "success", message: "User deleted successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function getUserTracks(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (id !== res.locals.user.id) return res.status(401).json({ status: "fail", message: "Unauthorized" });
    const tracks = await prisma.userTrack.findMany({
      where: { userId: id },
      include: { track: { include: { courses: true } } },
    });
    res.status(200).json({ status: "success", data: tracks });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function selectTrack(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { trackId } = req.body;
    if (id !== res.locals.user.id) return res.status(401).json({ status: "fail", message: "Unauthorized" });
    if (!trackId) return res.status(400).json({ status: "fail", message: "Track id is required" });
    const track = await prisma.track.findFirst({ where: { id: trackId } });
    if (!track) return res.status(404).json({ status: "fail", message: "Track not found" });
    await prisma.$transaction(async (tx) => {
      await tx.userTrack.upsert({
        where: { userId_trackId: { userId: id, trackId } },
        update: {},
        create: { userId: id, trackId },
      });
      await tx.user.update({ where: { id }, data: { currentTrackId: trackId } });
    });
    return res.status(200).json({ status: "success", message: "Selected track successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function quitTrack(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { trackId } = req.body;
    if (id !== res.locals.user.id) return res.status(401).json({ status: "fail", message: "Unauthorized" });
    if (!trackId) return res.status(400).json({ status: "fail", message: "Track id is required" });
    await prisma.$transaction(async (tx) => {
      const { count } = await tx.userTrack.deleteMany({ where: { userId: id, trackId } });
      if (count === 0) throw new Error("TRACK_NOT_FOUND");
      if (trackId === res.locals.user.currentTrackId)
        await tx.user.update({ where: { id }, data: { currentTrackId: null } });
    });
    return res.status(200).json({ status: "success", message: "Quitted track successfully" });
  } catch (err) {
    if ((err as Error).message === "TRACK_NOT_FOUND")
      return res.status(404).json({ status: "fail", message: "Track not found" });
    console.log(err);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function getUserCourses(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (id !== res.locals.user.id) return res.status(401).json({ status: "fail", message: "Unauthorized" });
    const courses = await prisma.membership.findMany({
      where: { userId: id },
      include: { course: { include: { track: true } } },
    });
    res.status(200).json({ status: "success", data: courses });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function joinCourse(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { courseId } = req.body;
    if (id !== res.locals.user.id) return res.status(401).json({ status: "fail", message: "Unauthorized" });
    if (!courseId) return res.status(400).json({ status: "fail", message: "course id is required" });
    const course = await prisma.course.findFirst({ where: { id: courseId } });
    if (!course) return res.status(404).json({ status: "fail", message: "Course not found" });
    await prisma.membership.create({ data: { userId: id, courseId, roleInCourse: res.locals.user.role } });
    return res.status(200).json({ status: "success", message: "Joined course successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function quitCourse(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { courseId } = req.body;
    if (id !== res.locals.user.id) return res.status(401).json({ status: "fail", message: "Unauthorized" });
    if (!courseId) return res.status(400).json({ status: "fail", message: "Course id is required" });
    const { count } = await prisma.membership.deleteMany({ where: { userId: id, courseId } });
    if (count === 0) return res.status(404).json({ status: "fail", message: "Course not found" });
    return res.status(200).json({ status: "success", message: "Quitted course successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}
