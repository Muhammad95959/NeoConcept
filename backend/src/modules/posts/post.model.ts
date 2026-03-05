import prisma from "../../config/db";

export class PostModel {
  static async findMany(where: any) {
    return prisma.post.findMany({ where });
  }

  static async findFirst(where: any) {
    return prisma.post.findFirst({ where });
  }

  static async create(data: any) {
    return prisma.post.create({ data });
  }

  static async update(id: string, data: any) {
    return prisma.post.update({ where: { id }, data });
  }

  static async delete(id: string) {
    return prisma.post.delete({ where: { id } });
  }

}
