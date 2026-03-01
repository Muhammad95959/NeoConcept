import prisma from "../../config/db";
import { Role, Status } from "../../generated/prisma";

export class UserModel {
  static findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  static findTrackById(trackId: string) {
    return prisma.track.findFirst({
      where: { id: trackId, deletedAt: null },
    });
  }

  static getUserCoursesModel(userId: string) {
    return prisma.userCourse.findMany({
      where: { userId },
      include: {
        course: {
          include: { track: true },
        },
      },
    });
  }

  static findCourseWithInstructors(courseId: string) {
    return prisma.course.findFirst({
      where: { id: courseId, deletedAt: null },
      include: {
        courseUsers: {
          where: { roleInCourse: Role.INSTRUCTOR },
        },
      },
    });
  }

  static getUserCourses(userId: string) {
    return prisma.userCourse.findMany({
      where: { userId },
      select: { courseId: true },
    });
  }

  static findUserEnrollment(userId: string, courseId: string) {
    return prisma.userCourse.findFirst({
      where: { userId, courseId },
    });
  }

  static deleteUserCourse(userId: string, courseId: string) {
    return prisma.userCourse.deleteMany({
      where: { userId, courseId, deletedAt: null },
    });
  }

  static findUserTracks(userId: string) {
    return prisma.userTrack.findMany({
      where: { userId, deletedAt: null },
      include: {
        track: {
          include: {
            courses: {
              where: { deletedAt: null },
              include: {
                courseUsers: {
                  where: {
                    roleInCourse: {
                      in: [Role.INSTRUCTOR, Role.ASSISTANT],
                    },
                  },
                  select: {
                    roleInCourse: true,
                    joinedAt: true,
                    user: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  static findUserCoursesUserTrackRequest(userId: string) {
    return prisma.userCourse.findMany({
      where: { userId },
      select: { courseId: true },
    });
  }

  static findStaffRequestsUserTrackRequest(userId: string) {
    return prisma.staffRequest.findMany({
      where: { userId },
      select: { courseId: true, status: true },
    });
  }

  static findStudentRequestsUserTrackRequest(userId: string) {
    return prisma.studentRequest.findMany({
      where: { userId },
      select: { courseId: true, status: true },
    });
  }

  static findStaffRequests(userId: string, status?: Status, search?: string) {
    const where: any = { userId };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        {
          course: {
            title: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          message: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    return prisma.staffRequest.findMany({
      where,
      include: { course: true },
    });
  }

  static findStudentRequests(userId: string, status?: Status, search?: string) {
    const where: any = { userId };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        {
          course: {
            title: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          message: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    return prisma.studentRequest.findMany({
      where,
      include: { course: true },
    });
  }

  static createUserCourse(userId: string, courseId: string, role: Role) {
    return prisma.userCourse.create({
      data: { userId, courseId, roleInCourse: role },
    });
  }

  static updateById(id: string, data: any) {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  static upsertUserTrack(tx: any, userId: string, trackId: string) {
    return tx.userTrack.upsert({
      where: {
        userId_trackId: { userId, trackId },
        deletedAt: null,
      },
      update: {},
      create: { userId, trackId },
    });
  }

  static updateUserCurrentTrack(
    tx: any,
    userId: string,
    trackId: string | null
  ) {
    return tx.user.update({
      where: { id: userId },
      data: { currentTrackId: trackId },
    });
  }

  static deleteUserTrack(tx: any, userId: string, trackId: string) {
    return tx.userTrack.deleteMany({
      where: { userId, trackId, deletedAt: null },
    });
  }

  static deleteUserWithRelations(user: any) {
    const now = new Date();

    return prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { deletedAt: now },
      });

      await tx.userTrack.updateMany({
        where: { userId: user.id, deletedAt: null },
        data: { deletedAt: now },
      });

      await tx.userCourse.updateMany({
        where: { userId: user.id, deletedAt: null },
        data: { deletedAt: now },
      });

      if (user.role === Role.ADMIN) {
        const trackId = user.currentTrackId;

        if (trackId) {
          await tx.track.update({
            where: { id: trackId },
            data: { deletedAt: now, creatorId: null },
          });

          await tx.course.updateMany({
            where: { trackId },
            data: { deletedAt: now },
          });

          await tx.userTrack.updateMany({
            where: { trackId },
            data: { deletedAt: now },
          });

          await tx.user.updateMany({
            where: { currentTrackId: trackId },
            data: { currentTrackId: null },
          });
        }
      }
    });
  }
}