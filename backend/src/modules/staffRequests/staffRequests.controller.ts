import { Request, Response, NextFunction } from "express";
import { Status } from "../../generated/prisma";
import { StaffRequestService } from "./staffRequests.service";
import { HttpStatusText } from "../../types/HTTPStatusText";

export class StaffRequestController {
  static async getMany(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await StaffRequestService.getMany(res.locals.user.currentTrackId);

      res.status(200).json({ status: HttpStatusText.SUCCESS, data });
    } catch (err) {
      next(err);
    }
  }

  static async get(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = res.locals.params;

      const data = await StaffRequestService.get(id);

      res.status(200).json({ status: HttpStatusText.SUCCESS, data });
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const user = res.locals.user;
      const { courseId, message } = res.locals.body;

      const data = await StaffRequestService.create(user.id, courseId, message);

      res.status(201).json({ status: HttpStatusText.SUCCESS, data });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = res.locals.params;
      const { message } = res.locals.body;

      const data = await StaffRequestService.update(id, res.locals.user.id, message);

      res.status(200).json({ status: HttpStatusText.SUCCESS, data });
    } catch (err) {
      next(err);
    }
  }

  static async answer(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = res.locals.params;
      const { status } = res.locals.body;

      const message = await StaffRequestService.answer(id, status as Status);

      res.status(200).json({ status: HttpStatusText.SUCCESS, message });
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = res.locals.params;

      await StaffRequestService.delete(id, res.locals.user.id);

      res.status(200).json({
        status: HttpStatusText.SUCCESS,
        message: "Request deleted successfully",
      });
    } catch (err) {
      next(err);
    }
  }
}
