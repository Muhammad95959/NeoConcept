import { Request, Response, NextFunction } from "express";
import { CommunityService } from "./community.service";
import { HTTPStatusText } from "../../types/HTTPStatusText";
import { SuccessMessages } from "../../types/successMessages";
import { CourseIdParams, MessageBody, IdParams, GetManyQuery } from "./community.validation";

export class CommunityController {
  static async getMany(_req: Request, res: Response, next: NextFunction) {
    try {
      const { courseId } = res.locals.params as CourseIdParams;
      const query = res.locals.query as GetManyQuery;
      const messages = await CommunityService.getMany(courseId, query);

      res.status(200).json({ status: HTTPStatusText.SUCCESS, data: messages });
    } catch (err) {
      next(err);
    }
  }

  static async get(_req: Request, res: Response, next: NextFunction) {
    try {
      const { courseId, messageId } = res.locals.params as IdParams;
      const message = await CommunityService.get(courseId, messageId);

      res.status(200).json({ status: HTTPStatusText.SUCCESS, data: message });
    } catch (err) {
      next(err);
    }
  }

  static async create(_req: Request, res: Response, next: NextFunction) {
    try {
      const { courseId } = res.locals.params as CourseIdParams;
      const { content } = res.locals.body as MessageBody;
      const userId = res.locals.user.id;
      const newMessage = await CommunityService.create(courseId, content, userId);

      res.status(201).json({ status: HTTPStatusText.SUCCESS, data: newMessage });
    } catch (err) {
      next(err);
    }
  }

  static async update(_req: Request, res: Response, next: NextFunction) {
    try {
      console.log("Updating message... with params:", res.locals.params, "and body:", res.locals.body);
      const { courseId, messageId } = res.locals.params as IdParams;
      console.log("Extracted courseId:", courseId, "messageId:", messageId);
      const { content } = res.locals.body as MessageBody;
       const userId = res.locals.user.id;
      const updatedMessage = await CommunityService.update(courseId, messageId, content, userId);


      res.status(200).json({ status: HTTPStatusText.SUCCESS, data: updatedMessage });
    } catch (err) {
      next(err);
    }
  }

  static async delete(_req: Request, res: Response, next: NextFunction) {
    try {
      const { courseId, messageId } = res.locals.params as IdParams;
       const userId = res.locals.user.id;
      await CommunityService.delete(courseId, messageId, userId);


      res.status(200).json({ status: HTTPStatusText.SUCCESS, message: SuccessMessages.MESSAGE_DELETED });
    } catch (err) {
      next(err);
    }
  }
}
