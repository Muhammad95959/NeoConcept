import prisma from "../../config/db";

export class CommunityModel {
  static async findMany(where: any, options: any = {}) {
    return prisma.communityMessage.findMany({ where, ...options });
  }

  static async findFirst(where: any, options: any = {}) {
    return prisma.communityMessage.findFirst({ where, ...options });
  }

  static async create(data: any) {
    return prisma.communityMessage.create({ data });
  }

  static async update(id: string, data: any) {
    return prisma.communityMessage.update({ where: { id }, data });
  }

  static async delete(id: string) {
    return prisma.communityMessage.delete({ where: { id } });
  }
}
