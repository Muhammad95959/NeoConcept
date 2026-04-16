import { Request, Response, NextFunction } from "express";
import { StaffRequestService } from "./staffRequests.service";
import { HTTPStatusText } from "../../types/HTTPStatusText";
import { SuccessMessages } from "../../types/successMessages";
import { IdParams, CreateBody, UpdateBody, AnswerBody } from "./staffRequests.validation";

export class StaffRequestController {
  static async getMany(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await StaffRequestService.getMany(res.locals.user.id);

      res.status(200).json({ status: HTTPStatusText.SUCCESS, data });
    } catch (err) {
      next(err);
    }
  }

  static async get(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = res.locals.params as IdParams;

      const data = await StaffRequestService.get(id);

      res.status(200).json({ status: HTTPStatusText.SUCCESS, data });
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const user = res.locals.user;
      const { courseId, message } = res.locals.body as CreateBody;

      const data = await StaffRequestService.create(user.id, courseId, message);

      res.status(201).json({ status: HTTPStatusText.SUCCESS, data });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = res.locals.params as IdParams;
      const { message } = res.locals.body as UpdateBody;

      const data = await StaffRequestService.update(id, res.locals.user.id, message);

      res.status(200).json({ status: HTTPStatusText.SUCCESS, data });
    } catch (err) {
      next(err);
    }
  }

  static async answer(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = res.locals.params as IdParams;
      const { status } = res.locals.body as AnswerBody;

      const message = await StaffRequestService.answer(id, status);

      res.status(200).json({ status: HTTPStatusText.SUCCESS, message });
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = res.locals.params as IdParams;

      await StaffRequestService.delete(id, res.locals.user.id);

      res.status(200).json({
        status: HTTPStatusText.SUCCESS,
        message: SuccessMessages.REQUEST_DELETED,
      });
    } catch (err) {
      next(err);
    }
  }
}
