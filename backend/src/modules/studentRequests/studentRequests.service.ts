import { Role, Status } from "../../generated/prisma";
import CustomError from "../../types/customError";
import { HttpStatusText } from "../../types/HTTPStatusText";
import { StudentRequestModel } from "./studentRequests.model";

export class StudentRequestService {
  static async getMany(userId: string, courseId: string, status?: Status) {
    const course = await StudentRequestModel.findCourse(courseId);
    if (!course) throw new CustomError("Course not found", 404, HttpStatusText.FAIL);

    const isStaff = await StudentRequestModel.findStaffMember(courseId, userId);
    if (!isStaff) throw new CustomError("You're not a staff member of this course", 403, HttpStatusText.FAIL);

    return StudentRequestModel.findManyByCourse(courseId, status);
  }

  static async getById(userId: string, id: string) {
    const request = await StudentRequestModel.findById(id);
    if (!request) throw new CustomError("Student request not found", 404, HttpStatusText.FAIL);

    const isStaff = await StudentRequestModel.findStaffMember(request.courseId, userId);
    if (!isStaff) throw new CustomError("You're not a staff member of this course", 403, HttpStatusText.FAIL);

    return request;
  }

  static async create(userId: string, courseId: string) {
    const course = await StudentRequestModel.findCourse(courseId);
    if (!course) throw new CustomError("Course not found", 404, HttpStatusText.FAIL);

    const isEnrolled = await StudentRequestModel.findEnrollment(userId, courseId);
    if (isEnrolled) throw new CustomError("You're already enrolled in this course", 400, HttpStatusText.FAIL);

    if (!course.protected)
      throw new CustomError(
        "This course is not protected, you can join it directly",
        400,
        HttpStatusText.FAIL,
      );

    const existingRequest = await StudentRequestModel.findPendingRequest(userId, courseId);
    if (existingRequest)
      throw new CustomError("You have already submitted a request for this course", 400, HttpStatusText.FAIL);

    return StudentRequestModel.create({ courseId, userId });
  }

  static async answer(userId: string, id: string, status: Status) {
    const request = await StudentRequestModel.findById(id);
    if (!request) throw new CustomError("Request not found", 404, HttpStatusText.FAIL);

    if (request.status !== Status.PENDING)
      throw new CustomError("Request already answered", 400, HttpStatusText.FAIL);

    const isStaff = await StudentRequestModel.findStaffMember(request.courseId, userId);
    if (!isStaff) throw new CustomError("You're not a staff member of this course", 403, HttpStatusText.FAIL);

    await StudentRequestModel.transaction(async (tx: any) => {
      await tx.studentRequest.update({ where: { id }, data: { status } });
      if (status === Status.APPROVED) {
        await tx.userCourse.create({
          data: { userId: request.userId, courseId: request.courseId, roleInCourse: Role.STUDENT },
        });
      }
    });

    return `Request ${status.toLowerCase()} successfully`;
  }

  static async delete(userId: string, id: string) {
    const request = await StudentRequestModel.findById(id);
    if (!request) throw new CustomError("Request not found", 404, HttpStatusText.FAIL);

    if (request.userId !== userId)
      throw new CustomError("You can only delete your own requests", 403, HttpStatusText.FAIL);

    if (request.status !== Status.PENDING)
      throw new CustomError("Only pending requests can be deleted", 400, HttpStatusText.FAIL);

    await StudentRequestModel.delete(id);
  }
}
