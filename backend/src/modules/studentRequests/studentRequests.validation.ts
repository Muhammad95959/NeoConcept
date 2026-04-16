import { z } from "zod";
import { Status } from "../../generated/prisma";

export class StudentRequestValidationSchemas {
  static getManyQuery = z
    .object({
      courseId: z.string().uuid("Invalid course ID"),
      status: z.string().optional(),
    })
    .refine((data) => !data.status || Object.values(Status).includes(data.status.toUpperCase() as Status), {
      message: "Invalid status",
      path: ["status"],
    });

  static getByIdParams = z.object({
    id: z.string().uuid("Invalid request ID"),
  });

  static createBody = z.object({
    courseId: z.string().uuid("Invalid course ID"),
  });

  static answerBody = z.object({
    status: z.enum([Status.APPROVED, Status.REJECTED]),
  });
}

export type GetManyQuery = z.infer<typeof StudentRequestValidationSchemas.getManyQuery>;
export type GetByIdParams = z.infer<typeof StudentRequestValidationSchemas.getByIdParams>;
export type CreateBody = z.infer<typeof StudentRequestValidationSchemas.createBody>;
export type AnswerBody = z.infer<typeof StudentRequestValidationSchemas.answerBody>;
