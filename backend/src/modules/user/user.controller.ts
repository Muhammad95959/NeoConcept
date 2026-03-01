import { NextFunction, Request, Response } from "express";
import { Status } from "../../generated/prisma";
import { UserService } from "./user.service";
import { HttpStatusText } from "../../types/HTTPStatusText";
import { CourseIdBody, TrackIdBody, UpdateUserInput } from "./user.validation";

export class UserController {
  static async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, password } = req.body as UpdateUserInput;
      const user = res.locals.user;

      const result = await UserService.updateUser({ userId: user.id, username, password, deletedAt: user.deletedAt });

      return res.status(200).json({
        status: HttpStatusText.SUCCESS,
        message: result.message,
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  }

  static async deleteUser(_req: Request, res: Response, next: NextFunction) {
    try {
      await UserService.deleteUser(res.locals.user);

      return res.status(200).json({
        status: HttpStatusText.SUCCESS,
        message: "User deleted successfully",
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  }

  static async getUserTracks(_req: Request, res: Response, next: NextFunction) {
    try {
      const tracks = await UserService.getUserTracks(res.locals.user);

      return res.status(200).json({
        status: HttpStatusText.SUCCESS,
        data: tracks,
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  }

  static async selectTrack(req: Request, res: Response, next: NextFunction) {
    try {
      const { trackId } = req.body as TrackIdBody;

      await UserService.selectTrack({user: res.locals.user, trackId});

      return res.status(200).json({
        status: HttpStatusText.SUCCESS,
        message: "Selected track successfully",
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  }

  static async quitTrack(req: Request, res: Response, next: NextFunction) {
    try {
      const { trackId } = req.body;

      await UserService.quitTrack({user: res.locals.user, trackId});

      return res.status(200).json({
        status: HttpStatusText.SUCCESS,
        message: "Quitted track successfully",
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  }

  static async getUserCourses(req: Request, res: Response, next: NextFunction) {
    try {
      const courses = await UserService.getUserCourses({userId: res.locals.user.id});

      return res.status(200).json({
        status: HttpStatusText.SUCCESS,
        data: courses,
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  }

  static async joinCourse(req: Request, res: Response, next: NextFunction) {
    try {
      const { courseId } = req.body as CourseIdBody;

      await UserService.joinCourse(res.locals.user, courseId);

      return res.status(200).json({
        status: HttpStatusText.SUCCESS,
        message: "Joined course successfully",
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  }

  static async quitCourse(req: Request, res: Response, next: NextFunction) {
    try {
      const { courseId } = req.body as CourseIdBody;

      await UserService.quitCourse(res.locals.user, courseId);

      return res.status(200).json({
        status: HttpStatusText.SUCCESS,
        message: "Quitted course successfully",
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  }

  static async getUserStaffRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, search } = req.query as {
        status?: Status;
        search?: string;
      };

      const requests = await UserService.getUserStaffRequests({user: res.locals.user, status, search});

      return res.status(200).json({
        status: HttpStatusText.SUCCESS,
        data: requests,
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  }

  static async getUserStudentRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, search } = req.query as {
        status?: Status;
        search?: string;
      };

      const requests = await UserService.getUserStudentRequests(res.locals.user, status, search);

      return res.status(200).json({
        status: HttpStatusText.SUCCESS,
        data: requests,
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  }
}
