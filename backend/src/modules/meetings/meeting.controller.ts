import { Request, Response, NextFunction } from "express";
import { MeetingService } from "./meeting.service";
import { HTTPStatusText } from "../../types/HTTPStatusText";
import { SuccessMessages } from "../../types/successMessages";
import {
  CourseIdParams,
  IdParams,
  MeetingIdParams,
  CreateBody,
  UpdateBody,
  RemoveParticipantParams,
} from "./meeting.validation";

export default class MeetingController {
  static async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const { courseId } = res.locals.params as CourseIdParams;
      const meetings = await MeetingService.getMeetingsByCourse(courseId);
      res.json({ status: HTTPStatusText.SUCCESS, data: meetings });
    } catch (err: any) {
      next(err);
    }
  }

  static async getOne(_req: Request, res: Response, next: NextFunction) {
    try {
      const { id, courseId } = res.locals.params as IdParams & CourseIdParams;
      const meeting = await MeetingService.getById(id, courseId);
      res.json({ status: HTTPStatusText.SUCCESS, data: meeting });
    } catch (err: any) {
      next(err);
    }
  }

  static async create(_req: Request, res: Response, next: NextFunction) {
    try {
      const { courseId } = res.locals.params as CourseIdParams;
      const body = res.locals.body as CreateBody;
      const result = await MeetingService.create(res.locals.user.id, courseId, body);
      res.status(201).json({ status: HTTPStatusText.SUCCESS, data: result });
    } catch (err: any) {
      next(err);
    }
  }

  static async update(_req: Request, res: Response, next: NextFunction) {
    try {
      const { id, courseId } = res.locals.params as IdParams & CourseIdParams;
      const body = res.locals.body as UpdateBody;
      const meeting = await MeetingService.update(res.locals.user.id, id, courseId, body);
      res.json({ status: HTTPStatusText.SUCCESS, data: meeting });
    } catch (err: any) {
      next(err);
    }
  }

  static async delete(_req: Request, res: Response, next: NextFunction) {
    try {
      const { id, courseId } = res.locals.params as IdParams & CourseIdParams;
      await MeetingService.delete(res.locals.user.id, id, courseId);
      res.json({
        status: HTTPStatusText.SUCCESS,
        message: SuccessMessages.DELETED_MEETING,
      });
    } catch (err: any) {
      next(err);
    }
  }

  static async join(_req: Request, res: Response, next: NextFunction) {
    try {
      const userId = res.locals.user.id;
      const { meetingId, courseId } = res.locals.params as MeetingIdParams & CourseIdParams;

      const result = await MeetingService.joinMeeting(userId, meetingId, courseId);
      res.json({ status: HTTPStatusText.SUCCESS, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async leave(_req: Request, res: Response, next: NextFunction) {
    try {
      const userId = res.locals.user.id;
      const { meetingId, courseId } = res.locals.params as MeetingIdParams & CourseIdParams;

      const result = await MeetingService.leaveMeeting(userId, meetingId, courseId);
      res.json({ status: HTTPStatusText.SUCCESS, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async removeParticipant(_req: Request, res: Response, next: NextFunction) {
    try {
      const hostId = res.locals.user.id;
      const { meetingId, userId, courseId } = res.locals.params as RemoveParticipantParams & CourseIdParams;

      const result = await MeetingService.removeParticipant(hostId, meetingId, userId, courseId);
      res.json({ status: HTTPStatusText.SUCCESS, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async startMeeting(_req: Request, res: Response, next: NextFunction) {
    try {
      const userId = res.locals.user.id;
      const { meetingId, courseId } = res.locals.params as MeetingIdParams & CourseIdParams;
      const meeting = await MeetingService.startMeeting(userId, meetingId, courseId);
      res.json({ status: HTTPStatusText.SUCCESS, meeting });
    } catch (err) {
      next(err);
    }
  }

  static async checkHost(_req: Request, res: Response, next: NextFunction) {
    try {
      const userId = res.locals.user.id;
      const { meetingId, courseId } = res.locals.params as MeetingIdParams & CourseIdParams;
      await MeetingService.checkHost(userId, meetingId, courseId);
      res.json({ status: HTTPStatusText.SUCCESS, isHost: true });
    } catch (err) {
      next(err);
    }
  }
}
