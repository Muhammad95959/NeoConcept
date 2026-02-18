import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import prisma from "../../config/db";
import { Role, Status } from "../../generated/prisma";

export async function updateUser(req: Request, res: Response) {
  try {
    const { password, username } = req.body;
    if (res.locals.user.deletedAt) return res.status(400).json({ status: "fail", message: "User not found" });
    if (!username?.trim() && !password)
      return res.status(400).json({ status: "fail", message: "Username or password is required" });
    const data: any = {};
    if (username?.trim()) data.username = username.trim();
    if (password) {
      data.password = await bcrypt.hash(password, 10);
      data.passwordChangedAt = new Date();
    }
    await prisma.user.update({ where: { id: res.locals.user.id }, data });
    res.status(200).json({
      status: "success",
      message: password ? "Password updated. Please log in again." : "User updated successfully",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function deleteUser(_req: Request, res: Response) {
  try {
    if (res.locals.user.deletedAt) return res.status(400).json({ status: "fail", message: "User not found" });
    await prisma.user.update({ where: { id: res.locals.user.id }, data: { deletedAt: new Date() } });
    res.status(200).json({ status: "success", message: "User deleted successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function getUserTracks(_req: Request, res: Response) {
  try {
    const tracks = await prisma.userTrack.findMany({
      where: { userId: res.locals.user.id },
      include: {
        track: {
          include: {
            courses: {
              where: { deletedAt: null },
              include: {
                courseUsers: {
                  where: { roleInCourse: { in: [Role.INSTRUCTOR, Role.ASSISTANT] } },
                  select: { roleInCourse: true, joinedAt: true, user: true },
                },
              },
            },
          },
        },
      },
    });
    const userCourses = await prisma.userCourse.findMany({
      where: { userId: res.locals.user.id },
      select: { courseId: true },
    });
    const userCourseIds = new Set(userCourses.map((uc) => uc.courseId));
    const studentRequests = await prisma.studentRequest.findMany({
      where: { userId: res.locals.user.id },
      select: { courseId: true, status: true },
    });
    const studentRequestMap = new Map(studentRequests.map((sr) => [sr.courseId, sr.status]));
    const staffRequests = await prisma.staffRequest.findMany({
      where: { userId: res.locals.user.id },
      select: { courseId: true, status: true },
    });
    const staffRequestMap = new Map(staffRequests.map((sr) => [sr.courseId, sr.status]));
    const formattedTracks = tracks.map((userTrack) => {
      return {
        ...userTrack.track,
        courses: userTrack.track.courses.map((course) => {
          if (res.locals.user.role === Role.STUDENT) {
            return {
              ...course,
              hasJoined: userCourseIds.has(course.id),
              studentRequestStatus: studentRequestMap.get(course.id) || null,
            };
          } else {
            return {
              ...course,
              hasJoined: userCourseIds.has(course.id),
              staffRequestStatus: staffRequestMap.get(course.id) || null,
            };
          }
        }),
      };
    });
    res.status(200).json({ status: "success", data: formattedTracks });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function selectTrack(req: Request, res: Response) {
  try {
    const { trackId } = req.body;
    if (res.locals.user.role === Role.ADMIN)
      return res.status(403).json({ status: "fail", message: "Admins cannot select tracks" });
    if (!trackId) return res.status(400).json({ status: "fail", message: "Track id is required" });
    const track = await prisma.track.findFirst({ where: { id: trackId } });
    if (!track) return res.status(404).json({ status: "fail", message: "Track not found" });
    await prisma.$transaction(async (tx) => {
      await tx.userTrack.upsert({
        where: { userId_trackId: { userId: res.locals.user.id, trackId } },
        update: {},
        create: { userId: res.locals.user.id, trackId },
      });
      await tx.user.update({ where: { id: res.locals.user.id }, data: { currentTrackId: trackId } });
    });
    return res.status(200).json({ status: "success", message: "Selected track successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function quitTrack(req: Request, res: Response) {
  try {
    const { trackId } = req.body;
    if (res.locals.user.role === Role.ADMIN)
      return res.status(403).json({ status: "fail", message: "Admins cannot quit tracks" });
    if (!trackId) return res.status(400).json({ status: "fail", message: "Track id is required" });
    await prisma.$transaction(async (tx) => {
      const { count } = await tx.userTrack.deleteMany({ where: { userId: res.locals.user.id, trackId } });
      if (count === 0) throw new Error("TRACK_NOT_FOUND");
      if (trackId === res.locals.user.currentTrackId)
        await tx.user.update({ where: { id: res.locals.user.id }, data: { currentTrackId: null } });
    });
    return res.status(200).json({ status: "success", message: "Quitted track successfully" });
  } catch (err) {
    console.log(err);
    if ((err as Error).message === "TRACK_NOT_FOUND")
      return res.status(404).json({ status: "fail", message: "Track not found" });
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function getUserCourses(_req: Request, res: Response) {
  try {
    const courses = await prisma.userCourse.findMany({
      where: { userId: res.locals.user.id },
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
    const { courseId } = req.body;
    if (res.locals.user.role !== Role.STUDENT)
      return res.status(403).json({ status: "fail", message: "Only students can join courses" });
    if (!courseId) return res.status(400).json({ status: "fail", message: "course id is required" });
    const course = await prisma.course.findFirst({
      where: { id: courseId },
      include: { courseUsers: { where: { roleInCourse: Role.INSTRUCTOR } } },
    });
    if (!course) return res.status(404).json({ status: "fail", message: "Course not found" });
    if (course.courseUsers.length === 0)
      return res.status(400).json({ status: "fail", message: "Course has no instructor, can't join" });
    const isEnrolled = await prisma.userCourse.findFirst({ where: { courseId, userId: res.locals.user.id } });
    if (isEnrolled) return res.status(400).json({ status: "fail", message: "You're already enrolled in this course" });
    if (course.protected)
      return res.status(403).json({
        status: "fail",
        message: "This course is protected, please submit a student request to join",
      });
    await prisma.userCourse.create({
      data: { userId: res.locals.user.id, courseId, roleInCourse: res.locals.user.role },
    });
    return res.status(200).json({ status: "success", message: "Joined course successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function quitCourse(req: Request, res: Response) {
  try {
    const { courseId } = req.body;
    if (res.locals.user.role !== Role.STUDENT)
      return res.status(403).json({ status: "fail", message: "Only students can quit courses" });
    if (!courseId) return res.status(400).json({ status: "fail", message: "Course id is required" });
    const { count } = await prisma.userCourse.deleteMany({ where: { userId: res.locals.user.id, courseId } });
    if (count === 0) return res.status(404).json({ status: "fail", message: "Course not found" });
    return res.status(200).json({ status: "success", message: "Quitted course successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function getUserStaffRequests(req: Request, res: Response) {
  try {
    const { status } = req.query as { status?: string };
    if (status && !Object.values(Status).includes(status.toUpperCase() as Status))
      return res.status(400).json({ status: "fail", message: "Invalid status" });
    if (res.locals.user.role !== (Role.INSTRUCTOR || Role.ASSISTANT))
      return res
        .status(403)
        .json({ status: "fail", message: "Only instructors and assistants can have staff requests" });
    const requests = await prisma.staffRequest.findMany({
      where: { userId: res.locals.user.id, status: status?.toUpperCase() as Status | undefined },
      include: { course: true },
    });
    res.status(200).json({ status: "success", data: requests });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function getUserStudentRequests(req: Request, res: Response) {
  try {
    const { status } = req.query as { status?: string };
    if (status && !Object.values(Status).includes(status.toUpperCase() as Status))
      return res.status(400).json({ status: "fail", message: "Invalid status" });
    if (res.locals.user.role !== Role.STUDENT)
      return res.status(403).json({ status: "fail", message: "Only students can have student requests" });
    const requests = await prisma.studentRequest.findMany({
      where: { userId: res.locals.user.id, status: status?.toUpperCase() as Status | undefined },
      include: { course: true },
    });
    res.status(200).json({ status: "success", data: requests });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}
