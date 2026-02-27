import { NextFunction, Request, Response } from "express";
import prisma from "../../config/db";
import { Role, Status } from "../../generated/prisma";
import { UserService } from "./user.service";
import { HttpStatusText } from "../../types/HTTPStatusText";

export async function updateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { username, password } = req.body;

    const user = res.locals.user;

    const result = await UserService.updateUser(user.id, username, password, user.deletedAt);

    res.status(200).json({
      status: HttpStatusText.SUCCESS,
      message: result.message,
    });
  } catch (err: any) {
    console.log(err);
    next(err);
  }
}

export async function deleteUser(_req: Request, res: Response, next: NextFunction) {
  try {
    await UserService.deleteUserService(res.locals.user);

    return res.status(200).json({
      status: HttpStatusText.SUCCESS,
      message: "User deleted successfully",
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

export async function getUserTracks(_req: Request, res: Response, next: NextFunction) {
  try {
    const tracks = await UserService.getUserTracksService(res.locals.user);

    return res.status(200).json({
      status: HttpStatusText.SUCCESS,
      data: tracks,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

export async function selectTrack(req: Request, res: Response, next: NextFunction) {
  try {
    const { trackId } = req.body;

    await UserService.selectTrackService(res.locals.user, trackId);

    return res.status(200).json({
      status: HttpStatusText.SUCCESS,
      message: "Selected track successfully",
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

export async function quitTrack(req: Request, res: Response, next: NextFunction) {
  try {
    const { trackId } = req.body;

    await UserService.quitTrackService(res.locals.user, trackId);

    return res.status(200).json({
      status: HttpStatusText.SUCCESS,
      message: "Quitted track successfully",
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}
export async function getUserCourses(req: Request, res: Response, next: NextFunction) {
  try {
    const courses = await UserService.getUserCoursesService(res.locals.user.id);

    return res.status(200).json({
      status: HttpStatusText.SUCCESS,
      data: courses,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

export async function joinCourse(req: Request, res: Response, next: NextFunction) {
  try {
    const { courseId } = req.body;

    await UserService.joinCourseService(res.locals.user, courseId);

    return res.status(200).json({
      status: HttpStatusText.SUCCESS,
      message: "Joined course successfully",
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

export async function quitCourse(req: Request, res: Response, next: NextFunction) {
  try {
    const { courseId } = req.body;

    await UserService.quitCourseService(res.locals.user, courseId);

    return res.status(200).json({
      status: HttpStatusText.SUCCESS,
      message: "Quitted course successfully",
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

export async function getUserStaffRequests(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, search } = req.query as {
      status?: Status;
      search?: string;
    };

    const requests = await UserService.getUserStaffRequestsService(res.locals.user, status, search);

    return res.status(200).json({
      status: HttpStatusText.SUCCESS,
      data: requests,
    });
  } catch (err) {
    console.log(err);

    next(err);
  }
}
export async function getUserStudentRequests(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, search } = req.query as {
      status?: Status;
      search?: string;
    };

    const requests = await UserService.getUserStudentRequestsService(res.locals.user, status, search);

    return res.status(200).json({
      status: HttpStatusText.SUCCESS,
      data: requests,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}
