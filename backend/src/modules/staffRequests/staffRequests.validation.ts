import { z } from "zod";
import { Status } from "../../generated/prisma";

export class StaffRequestValidationSchemas {
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

export type IdParams = z.infer<typeof StaffRequestValidationSchemas.idParams>;
export type CreateBody = z.infer<typeof StaffRequestValidationSchemas.createBody>;
export type UpdateBody = z.infer<typeof StaffRequestValidationSchemas.updateBody>;
export type AnswerBody = z.infer<typeof StaffRequestValidationSchemas.answerBody>;
