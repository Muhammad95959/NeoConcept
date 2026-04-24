import z from "zod";

export class CommunityValidationSchemas {
  static getManyQuery = z.object({
    date: z.string().optional(),
    before: z.string().optional(),
    after: z.string().optional(),
    page: z.string().transform(Number).optional(),
    limit: z.string().transform(Number).optional(),
  });

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

export type GetManyQuery = z.infer<typeof CommunityValidationSchemas.getManyQuery>;
export type CourseIdParams = z.infer<typeof CommunityValidationSchemas.courseIdParams>;
export type IdParams = z.infer<typeof CommunityValidationSchemas.idParams>;
export type MessageBody = z.infer<typeof CommunityValidationSchemas.messageBody>;
