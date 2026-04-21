import prisma from "../../config/db";
import CustomError from "../../types/customError";
import { ErrorMessages } from "../../types/errorsMessages";
import { HTTPStatusText } from "../../types/HTTPStatusText";
import { CommunityModel } from "./community.model";

interface GetMessagesQuery {
  date?: string;
  before?: string;
  after?: string;
}

export class CommunityService {
  static async getMany(courseId: string, query: GetMessagesQuery = {}) {
    const where: any = { courseId, course: { deletedAt: null } };
    if (query.date) {
      const day = new Date(query.date);
      if (isNaN(day.getTime())) throw new CustomError(ErrorMessages.DATE_NOT_VALID, 400, HTTPStatusText.FAIL);
      // Set day start and end
      where.createdAt = {
        gte: new Date(day.setHours(0, 0, 0, 0)),
        lte: new Date(day.setHours(23, 59, 59, 999)),
      };
    } else {
      if (query.before) {
        const before = new Date(query.before);
        if (isNaN(before.getTime())) throw new CustomError(ErrorMessages.DATE_NOT_VALID, 400, HTTPStatusText.FAIL);
        where.createdAt = { ...(where.createdAt || {}), lt: before };
      }
      if (query.after) {
        const after = new Date(query.after);
        if (isNaN(after.getTime())) throw new CustomError(ErrorMessages.DATE_NOT_VALID, 400, HTTPStatusText.FAIL);
        where.createdAt = { ...(where.createdAt || {}), gt: after };
      }
    }
    return CommunityModel.findMany(where, { orderBy: { createdAt: "asc" } });
  }

  static async get(courseId: string, messageId: string) {
    const message = await CommunityModel.findFirst({ id: messageId, courseId, course: { deletedAt: null } });
    if (!message) throw new CustomError(ErrorMessages.MESSAGE_NOT_FOUND, 404, HTTPStatusText.FAIL);
    return message;
  }

  static async create(courseId: string, content: string, userId: string) {
    const course = await prisma.course.findFirst({ where: { id: courseId, deletedAt: null } });
    if (!course) throw new CustomError(ErrorMessages.COURSE_NOT_FOUND, 404, HTTPStatusText.FAIL);
    if (!content?.trim()) throw new CustomError(ErrorMessages.INVALID_MESSAGE_CONTENT, 400, HTTPStatusText.FAIL);
    return CommunityModel.create({ content: content.trim(), courseId, userId });
  }

  static async update(courseId: string, messageId: string, content: string, userId: string) {
    const message = await CommunityModel.findFirst({ id: messageId, courseId, course: { deletedAt: null } });
    if (!message) throw new CustomError(ErrorMessages.MESSAGE_NOT_FOUND, 404, HTTPStatusText.FAIL);
    if (message.userId !== userId) throw new CustomError(ErrorMessages.UNAUTHORIZED, 401, HTTPStatusText.FAIL);
    if (!content?.trim()) throw new CustomError(ErrorMessages.INVALID_MESSAGE_CONTENT, 400, HTTPStatusText.FAIL);
    return CommunityModel.update(messageId, { content: content.trim() });
  }

  static async delete(courseId: string, messageId: string, userId: string) {
    const message = await CommunityModel.findFirst({ id: messageId, courseId, course: { deletedAt: null } });
    if (!message) throw new CustomError(ErrorMessages.MESSAGE_NOT_FOUND, 404, HTTPStatusText.FAIL);
    if (message.userId !== userId) throw new CustomError(ErrorMessages.UNAUTHORIZED, 401, HTTPStatusText.FAIL);
    await CommunityModel.delete(messageId);
  }
}
