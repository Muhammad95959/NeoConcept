import { z } from "zod";
import { Status } from "../../generated/prisma";

export class StudentRequestValidationSchemas {
  static getCourseStudentRequestsQuery = z
    .object({
      courseId: z.string().uuid("Invalid course ID"),
      status: z.string().optional(),
    })
    .refine(
      (data) => !data.status || Object.values(Status).includes(data.status.toUpperCase() as Status),
      {
        message: "Invalid status",
        path: ["status"],
      },
    );

  static getCourseStudentRequestParams = z.object({
    id: z.string().uuid("Invalid request ID"),
  });

  static createStudentRequestBody = z.object({
    courseId: z.string().uuid("Invalid course ID"),
  });

  static answerStudentRequestBody = z.object({
    status: z.enum([Status.APPROVED, Status.REJECTED]),
  });
}

export type GetCourseStudentRequestsQuery = z.infer<
  typeof StudentRequestValidationSchemas.getCourseStudentRequestsQuery
>;

export type CourseStudentRequestParams = z.infer<
  typeof StudentRequestValidationSchemas.getCourseStudentRequestParams
>;

export type CreateStudentRequestBody = z.infer<
  typeof StudentRequestValidationSchemas.createStudentRequestBody
>;

export type AnswerStudentRequestBody = z.infer<
  typeof StudentRequestValidationSchemas.answerStudentRequestBody
>;
