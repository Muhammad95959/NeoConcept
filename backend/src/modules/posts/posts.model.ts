import prisma from "../../config/db";

export const PostModel = {
  findMany(where: any) {
    return prisma.post.findMany({ where });
  },

  findFirst(where: any) {
    return prisma.post.findFirst({ where });
  },

  create(data: any) {
    return prisma.post.create({ data });
  },

  update(id: string, data: any) {
    return prisma.post.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.post.delete({ where: { id } });
  },
};