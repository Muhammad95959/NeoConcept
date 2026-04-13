import { Role, Status } from "../../generated/prisma";
import CustomError from "../../types/customError";
import { ErrorMessages } from "../../types/errorsMessages";
import { HTTPStatusText } from "../../types/HTTPStatusText";
import { StudentRequestModel } from "./studentRequests.model";

export class StudentRequestService {
  static async getMany(userId: string, courseId: string, status?: Status) {
    const course = await StudentRequestModel.findCourse(courseId);
    if (!course) throw new CustomError(ErrorMessages.COURSE_NOT_FOUND, 404, HTTPStatusText.FAIL);

    const isStaff = await StudentRequestModel.findStaffMember(courseId, userId);
    if (!isStaff)
      throw new CustomError(ErrorMessages.YOU_ARE_NOT_A_STAFF_MEMBER_OF_THIS_COURSE, 403, HTTPStatusText.FAIL);

    return StudentRequestModel.findManyByCourse(courseId, status);
  }

  static async getById(userId: string, id: string) {
    const request = await StudentRequestModel.findById(id);
    if (!request) throw new CustomError(ErrorMessages.STUDENT_REQUEST_NOT_FOUND, 404, HTTPStatusText.FAIL);

    const isStaff = await StudentRequestModel.findStaffMember(request.courseId, userId);
    if (!isStaff)
      throw new CustomError(ErrorMessages.YOU_ARE_NOT_A_STAFF_MEMBER_OF_THIS_COURSE, 403, HTTPStatusText.FAIL);

    return request;
  }

  static async create(userId: string, courseId: string) {
    const course = await StudentRequestModel.findCourse(courseId);
    if (!course) throw new CustomError(ErrorMessages.COURSE_NOT_FOUND, 404, HTTPStatusText.FAIL);

    const trackId = course.trackId;
    const userTracks = await StudentRequestModel.findUserTracks(userId);
    if (!userTracks.some((ut) => ut.trackId === trackId)) {
      throw new CustomError(
        ErrorMessages.YOU_CAN_ONLY_REQUEST_ACCESS_TO_COURSES_IN_YOUR_TRACKS,
        403,
        HTTPStatusText.FAIL,
      );
    }

    const isEnrolled = await StudentRequestModel.findEnrollment(userId, courseId);
    if (isEnrolled)
      throw new CustomError(ErrorMessages.YOU_ARE_ALREADY_ENROLLED_IN_THIS_COURSE, 400, HTTPStatusText.FAIL);

    if (!course.protected) throw new CustomError(ErrorMessages.THIS_COURSE_IS_NOT_PROTECTED, 400, HTTPStatusText.FAIL);

    const existingRequest = await StudentRequestModel.findPendingRequest(userId, courseId);
    if (existingRequest)
      throw new CustomError(
        ErrorMessages.YOU_HAVE_ALREADY_SUBMITTED_A_REQUEST_FOR_THIS_COURSE,
        400,
        HTTPStatusText.FAIL,
      );

    return StudentRequestModel.create({ courseId, userId });
  }

  static async answer(userId: string, id: string, status: Status) {
    const request = await StudentRequestModel.findById(id);
    if (!request) throw new CustomError(ErrorMessages.STUDENT_REQUEST_NOT_FOUND, 404, HTTPStatusText.FAIL);

    if (request.status !== Status.PENDING)
      throw new CustomError(ErrorMessages.REQUEST_ALREADY_ANSWERED, 400, HTTPStatusText.FAIL);

    const isStaff = await StudentRequestModel.findStaffMember(request.courseId, userId);
    if (!isStaff)
      throw new CustomError(ErrorMessages.YOU_ARE_NOT_A_STAFF_MEMBER_OF_THIS_COURSE, 403, HTTPStatusText.FAIL);

    await StudentRequestModel.transaction(async (tx: any) => {
      await tx.studentRequest.update({ where: { id }, data: { status } });
      if (status === Status.APPROVED) {
        await tx.userCourse.upsert({
          where: {
            userId_courseId: {
              userId: request.userId,
              courseId: request.courseId,
            },
          },
          create: { userId: request.userId, courseId: request.courseId, roleInCourse: Role.STUDENT },
          update: { roleInCourse: Role.STUDENT, deletedAt: null },
        });
      }
    });

    return `Request ${status.toLowerCase()} successfully`;
  }

  static async delete(userId: string, id: string) {
    const request = await StudentRequestModel.findById(id);
    if (!request) throw new CustomError(ErrorMessages.STUDENT_REQUEST_NOT_FOUND, 404, HTTPStatusText.FAIL);

    if (request.userId !== userId)
      throw new CustomError(ErrorMessages.YOU_CAN_ONLY_DELETE_YOUR_OWN_REQUESTS, 403, HTTPStatusText.FAIL);

    if (request.status !== Status.PENDING)
      throw new CustomError(ErrorMessages.ONLY_PENDING_REQUESTS_CAN_BE_DELETED, 400, HTTPStatusText.FAIL);

    await StudentRequestModel.delete(id);
  }
}
