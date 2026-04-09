import bcrypt from "bcryptjs";
import { UserModel } from "./user.model";
import CustomError from "../../types/customError";
import { HTTPStatusText } from "../../types/HTTPStatusText";
import { Role, Status } from "../../generated/prisma";
import {
  CoursesServicesInput,
  GetUserCoursesInput,
  GetUserStaffRequestsInput,
  TracksServicesInput,
  UpdateUserInputService,
} from "./user.type";
import { SuccessMessages } from "../../types/successMessages";
import { ErrorMessages } from "../../types/errorsMessages";

export class UserService {
  static async updateUser({ userId, username, password, deletedAt }: UpdateUserInputService) {
    if (deletedAt) {
      throw new CustomError(ErrorMessages.USER_NOT_FOUND, 404, HTTPStatusText.FAIL);
    }

    if (!username?.trim() && !password) {
      throw new CustomError(ErrorMessages.USERNAME_OR_PASSWORD_REQUIRED, 400, HTTPStatusText.FAIL);
    }

    const data: any = {};

    if (username?.trim()) {
      data.username = username.trim();
    }

    if (password) {
      data.password = await bcrypt.hash(password, 10);
      data.passwordChangedAt = new Date();
    }

    await UserModel.updateById(userId, data);

    return {
      message: password ? SuccessMessages.PASSWORD_UPDATED : SuccessMessages.USER_UPDATED,
    };
  }

  static async deleteUser(user: any) {
    if (user.deletedAt) {
      throw new CustomError(ErrorMessages.USER_NOT_FOUND, 404, HTTPStatusText.FAIL);
    }

    await UserModel.deleteUserWithRelations(user);
  }

  static async selectTrack({ user, trackId }: TracksServicesInput) {
    if (user.role === Role.ADMIN) {
      throw new CustomError(ErrorMessages.FORBIDDEN, 403, HTTPStatusText.FAIL);
    }

    const track = await UserModel.findTrackById(trackId);
    if (!track) throw new CustomError(ErrorMessages.TRACK_NOT_FOUND, 404, HTTPStatusText.FAIL);

    await UserModel.transaction(async (tx: any) => {
      await UserModel.upsertUserTrack(tx, user.id, trackId);
    });
  }

  static async quitTrack({ user, trackId }: TracksServicesInput) {
    if (user.role === Role.ADMIN) {
      throw new CustomError(ErrorMessages.FORBIDDEN, 403, HTTPStatusText.FAIL);
    }

    await UserModel.transaction(async (tx: any) => {
      const { count } = await UserModel.deleteUserTrack(tx, user.id, trackId);

      if (count === 0) {
        throw new CustomError(ErrorMessages.TRACK_NOT_FOUND, 404, HTTPStatusText.FAIL);
      }

    });
  }

  static async getUserCourses({ userId }: GetUserCoursesInput) {
    return UserModel.getUserCoursesModel(userId);
  }

  static async getUserStudentRequests(user: any, status?: Status, search?: string) {
    if (user.role !== Role.STUDENT) {
      throw new CustomError(ErrorMessages.ONLY_STUDENTS_CAN_HAVE_STUDENT_REQUESTS, 403, HTTPStatusText.FAIL);
    }

    return UserModel.findStudentRequests(user.id, status, search);
  }

  static async joinCourse({ user, courseId }: CoursesServicesInput) {
    if (user.role !== Role.STUDENT) {
      throw new CustomError(ErrorMessages.FORBIDDEN, 403, HTTPStatusText.FAIL);
    }

    const course = await UserModel.findCourseWithInstructors(courseId);

    if (!course) {
      throw new CustomError(ErrorMessages.COURSE_NOT_FOUND, 404, HTTPStatusText.FAIL);
    }

    if (course.courseUsers.length === 0) {
      throw new CustomError(ErrorMessages.COURSE_HAS_NO_INSTRUCTOR, 400, HTTPStatusText.FAIL);
    }

    const isEnrolled = await UserModel.findUserEnrollment(user.id, courseId);

    if (isEnrolled) {
      throw new CustomError(ErrorMessages.USER_ALREADY_ENROLLED_IN_COURSE, 400, HTTPStatusText.FAIL);
    }

    if (course.protected) {
      throw new CustomError(
        ErrorMessages.COURSE_IS_PROTECTED,
        403,
        HTTPStatusText.FAIL,
      );
    }

    await UserModel.createUserCourse(user.id, courseId, user.role);
  }

  static async quitCourse({ user, courseId }: CoursesServicesInput) {
    if (user.role !== Role.STUDENT) {
      throw new CustomError(ErrorMessages.FORBIDDEN, 403, HTTPStatusText.FAIL);
    }

    const { count } = await UserModel.deleteUserCourse(user.id, courseId);

    if (count === 0) {
      throw new CustomError(ErrorMessages.COURSE_NOT_FOUND, 404, HTTPStatusText.FAIL);
    }
  }

  static async getUserStaffRequests({ user, status, search }: GetUserStaffRequestsInput) {
    if (![Role.INSTRUCTOR, Role.ASSISTANT].includes(user.role)) {
      throw new CustomError(ErrorMessages.ONLY_INSTRUCTORS_AND_ASSISTANTS_CAN_HAVE_STAFF_REQUESTS, 403, HTTPStatusText.FAIL);
    }

    return UserModel.findStaffRequests(user.id, status, search);
  }

  static async getUserTracks(user: any) {
    const [tracks, userCourses] = await Promise.all([
      UserModel.findUserTracks(user.id),
      UserModel.findUserCoursesUserTrackRequest(user.id),
    ]);

    const userCourseIds = new Set(userCourses.map((uc) => uc.courseId));

    const requests =
      user.role === Role.STUDENT
        ? await UserModel.findStudentRequestsUserTrackRequest(user.id)
        : await UserModel.findStaffRequestsUserTrackRequest(user.id);

    const requestMap = new Map(requests.map((r) => [r.courseId, r.status]));

    const formattedTracks = tracks.map((userTrack) => ({
      ...userTrack.track,
      courses: userTrack.track.courses.map((course) => ({
        ...course,
        hasJoined: userCourseIds.has(course.id),
        ...(user.role === Role.STUDENT
          ? {
              studentRequestStatus: requestMap.get(course.id) || null,
            }
          : {
              staffRequestStatus: requestMap.get(course.id) || null,
            }),
      })),
    }));

    return formattedTracks;
  }
}
