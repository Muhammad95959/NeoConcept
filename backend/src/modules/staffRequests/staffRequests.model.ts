import prisma from "../../config/db";
import { Status } from "../../generated/prisma";

export class StaffRequestModel {
  static findTrackIdsByUser(userId: string) {
    return prisma.userTrack.findMany({
      where: { userId, deletedAt: null },
      select: { trackId: true },
    });
  }

  static findManyByTrackIds(trackIds: string[]) {
    return prisma.staffRequest.findMany({
      where: {
        user: {
          deletedAt: null,
          userTracks: {
            some: { trackId: { in: trackIds }, deletedAt: null },
          },
        },
      },
      include: { user: true, course: true },
    });
  }

  static findById(id: string) {
    return prisma.staffRequest.findUnique({
      where: { id },
      include: { user: true, course: true },
    });
  }

  static findCourse(courseId: string) {
    return prisma.course.findUnique({
      where: { id: courseId, deletedAt: null },
    });
  }

  static findPendingRequest(userId: string, courseId: string) {
    return prisma.staffRequest.findFirst({
      where: {
        userId,
        courseId,
        status: Status.PENDING,
      },
    });
  }

  static create(data: any) {
    return prisma.staffRequest.create({ data });
  }

  static update(id: string, data: any) {
    return prisma.staffRequest.update({
      where: { id },
      data,
    });
  }

  static delete(id: string) {
    return prisma.staffRequest.delete({
      where: { id },
    });
  }

  static transaction(cb: any) {
    return prisma.$transaction(cb);
  }
}
