import prisma from "../../config/db";
import { Role, Status } from "../../generated/prisma";

export const UserModel = {
  findById: (id: string) => {
    return prisma.user.findUnique({
      where: { id },
    });
  },
  findTrackById: (trackId: string) => {
    return prisma.track.findFirst({
      where: { id: trackId, deletedAt: null },
    });
  },
  findCourseWithInstructors: (courseId: string) => {
    return prisma.course.findFirst({
      where: { id: courseId, deletedAt: null },
      include: {
        courseUsers: {
          where: { roleInCourse: Role.INSTRUCTOR },
        },
      },
    });
  },
  getUserCourses: (userId: string) => {
    return prisma.userCourse.findMany({
      where: { userId },
      select: { courseId: true },
    });
  },
  findUserEnrollment: (userId: string, courseId: string) => {
    return prisma.userCourse.findFirst({
      where: { userId, courseId },
    });
  },
  getUserCoursesModel: (userId: string) => {
    return prisma.userCourse.findMany({
      where: { userId },
      include: {
        course: {
          include: { track: true },
        },
      },
    });
  },
  deleteUserCourse: (userId: string, courseId: string) => {
    return prisma.userCourse.deleteMany({
      where: { userId, courseId, deletedAt: null },
    });
  },
  findUserTracks: (userId: string) => {
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
  },
  findUserCoursesUserTrackRequest: (userId: string) => {
    return prisma.userCourse.findMany({
      where: { userId },
      select: { courseId: true },
    });
  },
  findStaffRequestsUserTrackRequest: (userId: string) => {
    return prisma.staffRequest.findMany({
      where: { userId },
      select: { courseId: true, status: true },
    });
  },
  findStudentRequestsUserTrackRequest: (userId: string) => {
    return prisma.studentRequest.findMany({
      where: { userId },
      select: { courseId: true, status: true },
    });
  },
  findStaffRequests: (userId: string, status?: Status, search?: string) => {
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
  },

  findStudentRequests: (userId: string, status?: Status, search?: string) => {
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
  },
  createUserCourse: (userId: string, courseId: string, role: Role) => {
    return prisma.userCourse.create({
      data: { userId, courseId, roleInCourse: role },
    });
  },
  updateById: (id: string, data: any) => {
    return prisma.user.update({
      where: { id },
      data,
    });
  },
  upsertUserTrack: (tx: any, userId: string, trackId: string) => {
    return tx.userTrack.upsert({
      where: {
        userId_trackId: { userId, trackId },
        deletedAt: null,
      },
      update: {},
      create: { userId, trackId },
    });
  },
  updateUserCurrentTrack: (tx: any, userId: string, trackId: string | null) => {
    return tx.user.update({
      where: { id: userId },
      data: { currentTrackId: trackId },
    });
  },

  deleteUserTrack: (tx: any, userId: string, trackId: string) => {
    return tx.userTrack.deleteMany({
      where: { userId, trackId, deletedAt: null },
    });
  },
  deleteUserWithRelations: (user: any) => {
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
  },
};
