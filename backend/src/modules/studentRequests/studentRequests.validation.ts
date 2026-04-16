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

  static idParams = z.object({
    id: z.string().uuid("Invalid request ID"),
  });

  static createBody = z.object({
    courseId: z.string().uuid("Invalid course ID"),
    message: z.string().optional(),
  });

  static updateBody = z.object({
    message: z.string().min(1, "Message is required"),
  });

  static answerBody = z.object({
    status: z.enum([Status.APPROVED, Status.REJECTED]),
  });
}

export type GetManyQuery = z.infer<typeof StudentRequestValidationSchemas.getManyQuery>;
export type IdParams = z.infer<typeof StudentRequestValidationSchemas.idParams>;
export type CreateBody = z.infer<typeof StudentRequestValidationSchemas.createBody>;
export type UpdateBody = z.infer<typeof StudentRequestValidationSchemas.updateBody>;
export type AnswerBody = z.infer<typeof StudentRequestValidationSchemas.answerBody>;
