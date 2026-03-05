import prisma from "../../config/db";

export class CourseModel {
  static findMany(where: any) {
    return prisma.course.findMany({
      where,
      include: { track: true, courseUsers: true },
    });
  }

  static findById(id: string) {
    return prisma.course.findFirst({
      where: { id, deletedAt: null },
      include: { track: true, courseUsers: true },
    });
  }

  static findDuplicate(trackId: string, name: string, excludeId?: string) {
    return prisma.course.findFirst({
      where: {
        trackId,
        deletedAt: null,
        name: { equals: name, mode: "insensitive" },
        ...(excludeId && { NOT: { id: excludeId } }),
      },
    });
  }

  static create(data: any) {
    return prisma.course.create({ data });
  }

  static update(id: string, data: any) {
    return prisma.course.update({ where: { id }, data });
  }

  static softDelete(id: string) {
    return prisma.course.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  static findUsersByIds(ids: string[]) {
    return prisma.user.findMany({
      where: { id: { in: ids }, deletedAt: null },
    });
  }

  static deleteCourseUsers(courseId: string) {
    return prisma.userCourse.deleteMany({ where: { courseId } });
  }

  static createCourseUsers(data: any[]) {
    return prisma.userCourse.createMany({ data });
  }

  static findTrackById(id: string) {
    return prisma.track.findFirst({
      where: { id, deletedAt: null },
    });
  }

  static transaction(callback: any) {
    return prisma.$transaction(callback);
  }
}