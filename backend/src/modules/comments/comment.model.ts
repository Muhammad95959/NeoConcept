import prisma from "../../config/db";

export class CommentModel {
  static findMany(postId: string) {
    return prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: "asc" },
    });
  }

  static findById(postId: string, id: string) {
    return prisma.comment.findFirst({
      where: { postId, id },
    });
  }

  static create(data: { content: string; postId: string; userId: string }) {
    return prisma.comment.create({ data });
  }

  static update(id: string, data: { content: string }) {
    return prisma.comment.update({
      where: { id },
      data,
    });
  }

  static delete(id: string) {
    return prisma.comment.delete({ where: { id } });
  }
}
