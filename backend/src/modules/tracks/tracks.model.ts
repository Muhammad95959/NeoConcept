import prisma from "../../config/db";
import { Role } from "../../generated/prisma";

export class TrackModel {
  static findMany(search?: string) {
    const where: any = { deletedAt: null };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { shortDescription: { contains: search, mode: "insensitive" } },
        { longDescription: { contains: search, mode: "insensitive" } },
      ];
    }

    return prisma.track.findMany({ where, include: { courses: true } });
  }

  static findById(id: string) {
    return prisma.track.findFirst({ where: { id, deletedAt: null }, include: { courses: true } });
  }

  static findByName(name: string) {
    return prisma.track.findFirst({ where: { deletedAt: null, name: { equals: name, mode: "insensitive" } } });
  }

  static findStaff(trackId: string) {
    return prisma.user.findMany({
      where: { currentTrackId: trackId, role: { in: [Role.INSTRUCTOR, Role.ASSISTANT] }, deletedAt: null },
    });
  }

  static create(data: any) {
    return prisma.track.create({ data });
  }

  static update(id: string, data: any) {
    return prisma.track.update({ where: { id }, data });
  }

  static delete(id: string) {
    return prisma.track.update({ where: { id }, data: { deletedAt: new Date(), creatorId: null } });
  }

  static transaction(cb: any) {
    return prisma.$transaction(cb);
  }
}
