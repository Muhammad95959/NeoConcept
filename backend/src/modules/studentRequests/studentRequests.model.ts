import prisma from "../../config/db";
import { Role, Status } from "../../generated/prisma";

export class StudentRequestModel {
  static findById(id: string) {
    return prisma.studentRequest.findUnique({
      where: { id },
    });
  }

  static findCourse(courseId: string) {
    return prisma.course.findUnique({
      where: { id: courseId, deletedAt: null },
    });
  }

  static findStaffMember(courseId: string, userId: string) {
    return prisma.userCourse.findFirst({
      where: {
        courseId,
        userId,
        roleInCourse: { in: [Role.INSTRUCTOR, Role.ASSISTANT] },
        deletedAt: null,
      },
    });
  }

  static findEnrollment(userId: string, courseId: string) {
    return prisma.userCourse.findFirst({
      where: { userId, courseId, deletedAt: null },
    });
  }

  static findPendingRequest(userId: string, courseId: string) {
    return prisma.studentRequest.findFirst({
      where: { userId, courseId, status: Status.PENDING },
    });
  }

  static findManyByCourse(courseId: string, status?: Status) {
    return prisma.studentRequest.findMany({
      where: { courseId, status },
    });
  }

  static findUserTracks(userId: string) {
    return prisma.userTrack.findMany({ where: { userId, deletedAt: null } });
  }

  static create(data: any) {
    return prisma.studentRequest.create({ data });
  }

  static delete(id: string) {
    return prisma.studentRequest.delete({
      where: { id },
    });
  }

  static transaction(cb: any) {
    return prisma.$transaction(cb);
  }
}
