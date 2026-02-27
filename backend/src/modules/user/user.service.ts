import bcrypt from "bcryptjs";
import { UserModel } from "./user.model";
import CustomError from "../../types/customError";
import { HttpStatusText } from "../../types/HTTPStatusText";
import { Role, Status } from "../../generated/prisma";
import prisma from "../../config/db";

export const UserService = {
  async updateUser(userId: string, username?: string, password?: string, deletedAt?: Date | null) {
    if (deletedAt) {
      throw new CustomError("User not found", 404, HttpStatusText.FAIL);
    }

    if (!username?.trim() && !password) {
      throw new CustomError("Username or password is required", 400, HttpStatusText.FAIL);
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
      message: password ? "Password updated. Please log in again." : "User updated successfully",
    };
  },

  async selectTrackService(user: any, trackId: string) {
    if (user.role === Role.ADMIN) {
      throw new CustomError("Forbidden", 403, HttpStatusText.FAIL);
    }

    const track = await UserModel.findTrackById(trackId);
    if (!track) throw new CustomError("Track not found", 404, HttpStatusText.FAIL);

    await prisma.$transaction(async (tx) => {
      await UserModel.upsertUserTrack(tx, user.id, trackId);
      await UserModel.updateUserCurrentTrack(tx, user.id, trackId);
    });
  },

  async quitTrackService(user: any, trackId: string) {
    if (user.role === Role.ADMIN) {
      throw new CustomError("Forbidden", 403, HttpStatusText.FAIL);
    }

    await prisma.$transaction(async (tx) => {
      const { count } = await UserModel.deleteUserTrack(tx, user.id, trackId);

      if (count === 0) {
        throw new CustomError("Track not found", 404, HttpStatusText.FAIL);
      }

      if (trackId === user.currentTrackId) {
        await UserModel.updateUserCurrentTrack(tx, user.id, null);
      }
    });
  },
  async getUserCoursesService(userId: string) {
    return UserModel.getUserCoursesModel(userId);
  },
  async getUserStudentRequestsService(user: any, status?: Status, search?: string) {
    if (user.role !== Role.STUDENT) {
      throw new CustomError("Only students can have student requests", 403, HttpStatusText.FAIL);
    }

    return UserModel.findStudentRequests(user.id, status, search);
  },
  async joinCourseService(user: any, courseId: string) {
    if (user.role !== Role.STUDENT) {
      throw new CustomError("Forbidden, Only students can join courses", 403, HttpStatusText.FAIL);
    }

    const course = await UserModel.findCourseWithInstructors(courseId);

    if (!course) {
      throw new CustomError("Course not found", 404, HttpStatusText.FAIL);
    }

    if (course.courseUsers.length === 0) {
      throw new CustomError("Course has no instructor, can't join", 400, HttpStatusText.FAIL);
    }

    const isEnrolled = await UserModel.findUserEnrollment(user.id, courseId);

    if (isEnrolled) {
      throw new CustomError("You're already enrolled in this course", 400, HttpStatusText.FAIL);
    }

    if (course.protected) {
      throw new CustomError(
        "This course is protected, please submit a student request to join",
        403,
        HttpStatusText.FAIL,
      );
    }

    await UserModel.createUserCourse(user.id, courseId, user.role);
  },
  async quitCourseService(user: any, courseId: string) {
    if (user.role !== Role.STUDENT) {
      throw new CustomError("Only students can quit courses", 403, HttpStatusText.FAIL);
    }

    const { count } = await UserModel.deleteUserCourse(user.id, courseId);

    if (count === 0) {
      throw new CustomError("Course not found", 404, HttpStatusText.FAIL);
    }
  },
  async getUserStaffRequestsService(user: any, status?: Status, search?: string) {
    if (![Role.INSTRUCTOR, Role.ASSISTANT].includes(user.role)) {
      throw new CustomError("Only instructors and assistants can have staff requests", 403, HttpStatusText.FAIL);
    }

    return UserModel.findStaffRequests(user.id, status, search);
  },
  async deleteUserService(user: any) {
    if (user.deletedAt) {
      throw new CustomError("User not found", 404, HttpStatusText.FAIL);
    }

    await UserModel.deleteUserWithRelations(user);
  },
  async getUserTracksService(user: any) {
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
  },
};
