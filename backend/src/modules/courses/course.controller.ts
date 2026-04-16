import { Request, Response, NextFunction } from "express";
import { CourseService } from "./course.service";
import { HTTPStatusText } from "../../types/HTTPStatusText";
import { SuccessMessages } from "../../types/successMessages";
import { GetManyQuery, IdParams, CreateBody, UpdateBody, UpdatePrerequisitesBody, UpdateStaffBody } from "./course.validation";

export class CourseController {
  static async getMany(req: Request, res: Response, next: NextFunction) {
    try {
      const query = res.locals.query as GetManyQuery;
      const data = await CourseService.getMany(query);
      res.status(200).json({ status: HTTPStatusText.SUCCESS, data });
    } catch (err) {
      next(err);
    }
  }

  static async get(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = res.locals.params as IdParams;
      const data = await CourseService.get(id);
      res.status(200).json({ status: HTTPStatusText.SUCCESS, data });
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const body = res.locals.body as CreateBody;
      const data = await CourseService.create(body);
      res.status(201).json({ status: HTTPStatusText.SUCCESS, data });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = res.locals.params as IdParams;
      const body = res.locals.body as UpdateBody;
      const data = await CourseService.update(id, body);
      res.status(200).json({ status: HTTPStatusText.SUCCESS, data });
    } catch (err) {
      next(err);
    }
  }

  static async updatePrerequisites(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = res.locals.params as IdParams;
      const body = res.locals.body as UpdatePrerequisitesBody;
      const data = await CourseService.updatePrerequisites(id, body);
      res.status(200).json({ status: HTTPStatusText.SUCCESS, data });
    } catch (err) {
      next(err);
    }
  }

  static async updateStaff(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = res.locals.params as IdParams;
      const body = res.locals.body as UpdateStaffBody;
      const data = await CourseService.updateStaff(id, body);

      res.status(200).json({
        status: HTTPStatusText.SUCCESS,
        ...data,
      });
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = res.locals.params as IdParams;
      await CourseService.delete(id);
      res.status(200).json({ status: HTTPStatusText.SUCCESS, message: SuccessMessages.COURSE_DELETED });
    } catch (err) {
      next(err);
    }
  }
}
