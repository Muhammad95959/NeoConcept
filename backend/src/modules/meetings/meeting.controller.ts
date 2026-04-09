import { Request, Response, NextFunction } from "express";
import { MeetingService } from "./meeting.service";
import { HTTPStatusText } from "../../types/HTTPStatusText";
import { SuccessMessages } from "../../types/successMessages";

export default class MeetingController {
  static async getAllUser(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = res.locals.user.id;
      const meetings = await MeetingService.getUserMeetings(userId);
      res.json({ status: HTTPStatusText.SUCCESS, data: meetings });
    } catch (err: any) {
      next(err);
    }
  }

  static async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const meeting = await MeetingService.getById(req.params.id);
      res.json({ status: HTTPStatusText.SUCCESS, data: meeting });
    } catch (err: any) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await MeetingService.create(res.locals.user.id, req.body);
      res.status(201).json({ status: HTTPStatusText.SUCCESS, data: result });
    } catch (err: any) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const meeting = await MeetingService.update(res.locals.user.id, req.params.id, req.body);
      res.json({ status: HTTPStatusText.SUCCESS, data: meeting });
    } catch (err: any) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await MeetingService.delete(res.locals.user.id, req.params.id);
      res.json({
        status: HTTPStatusText.SUCCESS,
        message: SuccessMessages.DELETED_MEETING,
      });
    } catch (err: any) {
      next(err);
    }
  }

  static async join(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = res.locals.user.id;
      const { meetingId } = req.params;

      const result = await MeetingService.joinMeeting(userId, meetingId);
      res.json({ status: HTTPStatusText.SUCCESS, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async leave(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = res.locals.user.id;
      const { meetingId } = req.params;

      const result = await MeetingService.leaveMeeting(userId, meetingId);
      res.json({ status: HTTPStatusText.SUCCESS, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async addParticipant(req: Request, res: Response, next: NextFunction) {
    try {
      const hostId = res.locals.user.id;
      const { meetingId } = req.params;
      const { userId } = req.body;

      const result = await MeetingService.addParticipant(hostId, meetingId, userId);
      res.json({ status: HTTPStatusText.SUCCESS, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async removeParticipant(req: Request, res: Response, next: NextFunction) {
    try {
      const hostId = res.locals.user.id;
      const { meetingId, userId } = req.params;

      const result = await MeetingService.removeParticipant(hostId, meetingId, userId);
      res.json({ status: HTTPStatusText.SUCCESS, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async startMeeting(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = res.locals.user.id;
      const meetingId = req.params.meetingId;
      const meeting = await MeetingService.startMeeting(userId, meetingId);
      res.json({ status: HTTPStatusText.SUCCESS, meeting });
    } catch (err) {
      next(err);
    }
  }

  static async checkHost(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = res.locals.user.id;
      const meetingId = req.params.meetingId;
      await MeetingService.checkHost(userId, meetingId);
      res.json({ status: HTTPStatusText.SUCCESS, isHost: true });
    } catch (err) {
      next(err);
    }
  }
}
