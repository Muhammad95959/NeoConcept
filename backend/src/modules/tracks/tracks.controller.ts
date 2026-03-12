import { Request, Response, NextFunction } from "express";
import { TrackService } from "./tracks.service";
import { HttpStatusText } from "../../types/HTTPStatusText";
import safeUserData from "../../utils/safeUserData";

export class TrackController {
  static async getTracks(req: Request, res: Response, next: NextFunction) {
    try {
      const { search } = res.locals.query as { search?: string };
      const data = await TrackService.getMany(search);

      res.status(200).json({ status: HttpStatusText.SUCCESS, data });
    } catch (err) {
      next(err);
    }
  }

  static async getTrackById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = res.locals.params as { id: string };
      const data = await TrackService.getById(id);

      res.status(200).json({ status: HttpStatusText.SUCCESS, data });
    } catch (err) {
      next(err);
    }
  }

  static async getTrackStaff(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = res.locals.params as { id: string };
      const data = await TrackService.getStaff(id, res.locals.user.currentTrackId, safeUserData);

      res.status(200).json({ status: HttpStatusText.SUCCESS, data });
    } catch (err) {
      next(err);
    }
  }

  static async createTrack(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = res.locals.body;
      const data = await TrackService.create(res.locals.user.id, payload);

      res.status(201).json({ status: HttpStatusText.SUCCESS, data });
    } catch (err) {
      next(err);
    }
  }

  static async updateTrack(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = res.locals.params as { id: string };
      const payload = res.locals.body;
      const data = await TrackService.update(id, payload);

      res.status(200).json({ status: HttpStatusText.SUCCESS, data });
    } catch (err) {
      next(err);
    }
  }

  static async deleteTrack(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = res.locals.params as { id: string };
      await TrackService.delete(id);

      res.status(200).json({ status: HttpStatusText.SUCCESS, message: "Track deleted successfully" });
    } catch (err) {
      next(err);
    }
  }
}
