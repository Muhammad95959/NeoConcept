import { z } from "zod";
import { Status } from "../../generated/prisma";

export class StaffRequestValidationSchemas {
  static getByIdParams = z.object({
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

export type GetStaffRequestByIdParams = z.infer<typeof StaffRequestValidationSchemas.getByIdParams>;
export type CreateStaffRequestBody = z.infer<typeof StaffRequestValidationSchemas.createBody>;
export type UpdateStaffRequestBody = z.infer<typeof StaffRequestValidationSchemas.updateBody>;
export type AnswerStaffRequestBody = z.infer<typeof StaffRequestValidationSchemas.answerBody>;
