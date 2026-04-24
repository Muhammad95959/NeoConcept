import prisma from "../../config/db";
import { emitToCommunity } from "../../config/socket";
import CustomError from "../../types/customError";
import { ErrorMessages } from "../../types/errorsMessages";
import { HTTPStatusText } from "../../types/HTTPStatusText";
import { SocketEvents } from "../../types/socketEvents";
import { CommunityModel } from "./community.model";

interface GetMessagesQuery {
  date?: string;
  before?: string;
  after?: string;
  page?: number;
  limit?: number;
}

export class CommunityService {
  static DEFAULT_PAGE_SIZE = 20;

  static async getMany(courseId: string, query: GetMessagesQuery = {}) {
    const where: any = { courseId, course: { deletedAt: null } };
    const { page = 1, limit = this.DEFAULT_PAGE_SIZE } = query;

    if (query.date) {
      const day = new Date(query.date);
      if (isNaN(day.getTime())) throw new CustomError(ErrorMessages.DATE_NOT_VALID, 400, HTTPStatusText.FAIL);
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

    const messages = await CommunityModel.findMany(where, {
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return messages;
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

    const newMessage = await CommunityModel.create({ content: content.trim(), courseId, userId });

    emitToCommunity(courseId, SocketEvents.NEW_MESSAGE, newMessage);

    return newMessage;
  }

  static async update(courseId: string, messageId: string, content: string, userId: string) {
    const message = await CommunityModel.findFirst({ id: messageId, courseId, course: { deletedAt: null } });
    if (!message) throw new CustomError(ErrorMessages.MESSAGE_NOT_FOUND, 404, HTTPStatusText.FAIL);
    if (message.userId !== userId) throw new CustomError(ErrorMessages.UNAUTHORIZED, 401, HTTPStatusText.FAIL);
    if (!content?.trim()) throw new CustomError(ErrorMessages.INVALID_MESSAGE_CONTENT, 400, HTTPStatusText.FAIL);

    const updatedMessage = await CommunityModel.update(messageId, { content: content.trim() });

    emitToCommunity(courseId, SocketEvents.UPDATED_MESSAGE, updatedMessage);

    return updatedMessage;
  }

  static async delete(courseId: string, messageId: string, userId: string) {
    const message = await CommunityModel.findFirst({ id: messageId, courseId, course: { deletedAt: null } });
    if (!message) throw new CustomError(ErrorMessages.MESSAGE_NOT_FOUND, 404, HTTPStatusText.FAIL);
    if (message.userId !== userId) throw new CustomError(ErrorMessages.UNAUTHORIZED, 401, HTTPStatusText.FAIL);

    await CommunityModel.delete(messageId);

    emitToCommunity(courseId, SocketEvents.DELETED_MESSAGE, { id: messageId });
  }
}
