import prisma from "../../config/db";

export class QuizModel {
  static async findMany(where: any) {
    return prisma.quiz.findMany({
      where,
      include: {
        questions: {
          include: {
            options: true,
          },
          orderBy: {
            order: 'asc',
          }
        },
      },
      orderBy: {
        createdAt: 'desc',
      }
    });
  }

  static async findFirst(where: any) {
    return prisma.quiz.findFirst({
      where,
      include: {
        questions: {
          include: {
            options: true,
          },
          orderBy: {
            order: 'asc',
          }
        },
      },
    });
  }

  static async create(data: any) {
    return prisma.quiz.create({
      data,
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });
  }

  static async update(id: string, data: any) {
    return prisma.quiz.update({
      where: { id },
      data,
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });
  }

  static async delete(id: string) {
    return prisma.quiz.delete({ where: { id } });
  }
}
