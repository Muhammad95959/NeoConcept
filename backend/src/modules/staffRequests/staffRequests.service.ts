import { Status } from "../../generated/prisma";
import CustomError from "../../types/customError";
import { ErrorMessages } from "../../types/errorsMessages";
import { HTTPStatusText } from "../../types/HTTPStatusText";
import { StaffRequestModel } from "./staffRequests.model";

export class StaffRequestService {
  static async getMany(trackId: string) {
    return StaffRequestModel.findManyByTrack(trackId);
  }

  static async get(id: string) {
    const request = await StaffRequestModel.findById(id);

    if (!request) {
      throw new CustomError(ErrorMessages.REQUEST_NOT_FOUND, 404, HTTPStatusText.FAIL);
    }

    return request;
  }

  static async create(userId: string, courseId: string, message?: string) {
    const course = await StaffRequestModel.findCourse(courseId);

    if (!course) {
      throw new CustomError(ErrorMessages.COURSE_NOT_FOUND, 404, HTTPStatusText.FAIL);
    }

    const existingRequest = await StaffRequestModel.findPendingRequest(userId, courseId);

    if (existingRequest) {
      throw new CustomError(
        ErrorMessages.YOU_ALREADY_HAVE_A_PENDING_REQUEST_FOR_THIS_COURSE,
        400,
        HTTPStatusText.FAIL
      );
    }

    return StaffRequestModel.create({
      userId,
      courseId,
      message,
    });
  }

  static async update(id: string, userId: string, message: string) {
    const request = await StaffRequestModel.findById(id);

    if (!request) throw new CustomError(ErrorMessages.REQUEST_NOT_FOUND, 404, HTTPStatusText.FAIL);

    if (request.userId !== userId) {
      throw new CustomError(ErrorMessages.YOU_CAN_ONLY_UPDATE_YOUR_OWN_REQUESTS, 401, HTTPStatusText.FAIL);
    }

    if (request.status !== Status.PENDING) {
      throw new CustomError(ErrorMessages.ONLY_PENDING_REQUESTS_CAN_BE_UPDATED, 400, HTTPStatusText.FAIL);
    }

    return StaffRequestModel.update(id, { message });
  }

  static async answer(id: string, status: Status) {
    const request = await StaffRequestModel.findById(id);

    if (!request) throw new CustomError(ErrorMessages.REQUEST_NOT_FOUND, 404, HTTPStatusText.FAIL);

    if (request.status !== Status.PENDING) {
      throw new CustomError(ErrorMessages.REQUEST_ALREADY_ANSWERED, 400, HTTPStatusText.FAIL);
    }

    await StaffRequestModel.transaction(async (tx: any) => {
      await tx.staffRequest.update({
        where: { id },
        data: { status },
      });

      if (status === Status.APPROVED) {
        await tx.userCourse.upsert({
          where: {
            userId_courseId: {
              userId: request.userId,
              courseId: request.courseId,
            },
          },
          create: {
            userId: request.userId,
            courseId: request.courseId,
            roleInCourse: request.user.role,
          },
          update: {
            roleInCourse: request.user.role,
            deletedAt: null,
          },
        });
      }
    });

    return `Request ${status.toLowerCase()} successfully`;
  }

  static async delete(id: string, userId: string) {
    const request = await StaffRequestModel.findById(id);

    if (!request) throw new CustomError(ErrorMessages.REQUEST_NOT_FOUND, 404, HTTPStatusText.FAIL);

    if (request.userId !== userId) {
      throw new CustomError(ErrorMessages.YOU_CAN_ONLY_DELETE_YOUR_OWN_REQUESTS, 403, HTTPStatusText.FAIL);
    }

    if (request.status !== Status.PENDING) {
      throw new CustomError(ErrorMessages.ONLY_PENDING_REQUESTS_CAN_BE_DELETED, 400, HTTPStatusText.FAIL);
    }

    await StaffRequestModel.delete(id);
  }
}