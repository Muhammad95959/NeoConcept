import { Request, Response, NextFunction } from "express";
import { TrackService } from "./tracks.service";
import { HTTPStatusText } from "../../types/HTTPStatusText";
import safeUserData from "../../utils/safeUserData";
import { SuccessMessages } from "../../types/successMessages";
import { GetManyQuery, IdParams, CreateBody, UpdateBody } from "./tracks.validation";

export class TrackController {
  static async getTracks(_req: Request, res: Response, next: NextFunction) {
    try {
      const { search } = res.locals.query as GetManyQuery;
      const data = await TrackService.getMany(search);

      res.status(200).json({ status: HTTPStatusText.SUCCESS, data });
    } catch (err) {
      next(err);
    }
  }

  static async getTrackById(_req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = res.locals.params as IdParams;
      const data = await TrackService.getById(id);

      res.status(200).json({ status: HTTPStatusText.SUCCESS, data });
    } catch (err) {
      next(err);
    }
  }

  static async getTrackStaff(_req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = res.locals.params as IdParams;
      const data = await TrackService.getStaff(id, res.locals.user.id, safeUserData);

      res.status(200).json({ status: HTTPStatusText.SUCCESS, data });
    } catch (err) {
      next(err);
    }
  }

  static async createTrack(_req: Request, res: Response, next: NextFunction) {
    try {
      const payload = res.locals.body as CreateBody;
      const data = await TrackService.create(res.locals.user.id, payload);

      res.status(201).json({ status: HTTPStatusText.SUCCESS, data });
    } catch (err) {
      next(err);
    }
  }

  static async updateTrack(_req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = res.locals.params as IdParams;
      const payload = res.locals.body as UpdateBody;
      const data = await TrackService.update(id, payload);

      res.status(200).json({ status: HTTPStatusText.SUCCESS, data });
    } catch (err) {
      next(err);
    }
  }

  static async deleteTrack(_req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = res.locals.params as IdParams;
      await TrackService.delete(id);

      res.status(200).json({ status: HTTPStatusText.SUCCESS, message: SuccessMessages.TRACK_DELETED });
    } catch (err) {
      next(err);
    }
  }
}
