import { Request, Response, NextFunction } from "express";
import { CourseService } from "./course.service";
import { HTTPStatusText } from "../../types/HTTPStatusText";
import { SuccessMessages } from "../../types/successMessages";

export class CourseController {
  static async getMany(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await CourseService.getMany(res.locals.query);
      res.status(200).json({ status: HTTPStatusText.SUCCESS, data });
    } catch (err) {
      next(err);
    }
  }

  static async get(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = res.locals.params;
      const data = await CourseService.get(id);
      res.status(200).json({ status: HTTPStatusText.SUCCESS, data });
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await CourseService.create(res.locals.body);
      res.status(201).json({ status: HTTPStatusText.SUCCESS, data });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = res.locals.params;
      const data = await CourseService.update(id, res.locals.body);
      res.status(200).json({ status: HTTPStatusText.SUCCESS, data });
    } catch (err) {
      next(err);
    }
  }
  static async updateStaff(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = res.locals.params;
      const data = await CourseService.updateStaff(id, res.locals.body);

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
      const { id } = res.locals.params;
      await CourseService.delete(id);
      res.status(200).json({ status: HTTPStatusText.SUCCESS, message: SuccessMessages.COURSE_DELETED });
    } catch (err) {
      next(err);
    }
  }
}
