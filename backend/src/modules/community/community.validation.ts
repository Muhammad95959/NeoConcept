import z from "zod";

export class CommunityValidationSchemas {
  static courseIdParams = z.object({
    courseId: z.string().uuid(),
  });

  static idParams = z.object({
    courseId: z.string().uuid(),
    messageId: z.string().uuid(),
  });

  static messageBody = z.object({
    content: z.string().min(1, "Content cannot be empty"),
  });
}

export type CourseIdParams = z.infer<typeof CommunityValidationSchemas.courseIdParams>;
export type IdParams = z.infer<typeof CommunityValidationSchemas.idParams>;
export type MessageBody = z.infer<typeof CommunityValidationSchemas.messageBody>;
