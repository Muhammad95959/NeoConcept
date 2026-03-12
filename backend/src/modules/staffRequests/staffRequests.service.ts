import { Status } from "../../generated/prisma";
import CustomError from "../../types/customError";
import { HttpStatusText } from "../../types/HTTPStatusText";
import { StaffRequestModel } from "./staffRequests.model";

export class StaffRequestService {
  static async getMany(trackId: string) {
    return StaffRequestModel.findManyByTrack(trackId);
  }

  static async get(id: string) {
    const request = await StaffRequestModel.findById(id);

    if (!request) {
      throw new CustomError("Request not found", 404, HttpStatusText.FAIL);
    }

    return request;
  }

  static async create(userId: string, courseId: string, message?: string) {
    const course = await StaffRequestModel.findCourse(courseId);

    if (!course) {
      throw new CustomError("Course not found", 404, HttpStatusText.FAIL);
    }

    const existingRequest = await StaffRequestModel.findPendingRequest(userId, courseId);

    if (existingRequest) {
      throw new CustomError(
        "You already have a pending request for this course",
        400,
        HttpStatusText.FAIL
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

    if (!request) throw new CustomError("Request not found", 404, HttpStatusText.FAIL);

    if (request.userId !== userId) {
      throw new CustomError("You can only update your own requests", 401);
    }

    if (request.status !== Status.PENDING) {
      throw new CustomError("Only pending requests can be updated", 400, HttpStatusText.FAIL);
    }

    return StaffRequestModel.update(id, { message });
  }

  static async answer(id: string, status: Status) {
    const request = await StaffRequestModel.findById(id);

    if (!request) throw new CustomError("Request not found", 404, HttpStatusText.FAIL);

    if (request.status !== Status.PENDING) {
      throw new CustomError("Request already answered", 400, HttpStatusText.FAIL);
    }

    await StaffRequestModel.transaction(async (tx: any) => {
      await tx.staffRequest.update({
        where: { id },
        data: { status },
      });

      if (status === Status.APPROVED) {
        await tx.userCourse.create({
          data: {
            userId: request.userId,
            courseId: request.courseId,
            roleInCourse: request.user.role,
          },
        });
      }
    });

    return `Request ${status.toLowerCase()} successfully`;
  }

  static async delete(id: string, userId: string) {
    const request = await StaffRequestModel.findById(id);

    if (!request) throw new CustomError("Request not found", 404);

    if (request.userId !== userId) {
      throw new CustomError("You can only delete your own requests", 403);
    }

    if (request.status !== Status.PENDING) {
      throw new CustomError("Only pending requests can be deleted", 400);
    }

    await StaffRequestModel.delete(id);
  }
}