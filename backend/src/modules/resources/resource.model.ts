import prisma from "../../config/db";

export class ResourceModel {
  static findCourseById(id: string) {
    return prisma.course.findFirst({
      where: { id, deletedAt: null },
    });
  }

  static findResourceById(id: string) {
    return prisma.resource.findUnique({
      where: { id },
    });
  }

  static findManyByCourse(courseId: string) {
    return prisma.resource.findMany({
      where: { courseId },
    });
  }

  static create(data: any) {
    return prisma.resource.create({ data });
  }

  static delete(id: string) {
    return prisma.resource.delete({ where: { id } });
  }
}
