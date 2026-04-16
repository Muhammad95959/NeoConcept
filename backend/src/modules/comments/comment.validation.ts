import z from "zod";

export class CommentValidationSchemas {
  static coursePostParams = z.object({
    courseId: z.string().uuid("Invalid course ID"),
    postId: z.string().uuid("Invalid post ID"),
  });

  static idParams = z.object({
    courseId: z.string().uuid("Invalid course ID"),
    postId: z.string().uuid("Invalid post ID"),
    id: z.string().uuid("Invalid comment ID"),
  });

  static contentBody = z.object({
    content: z.string().min(1).trim(),
  });
}

export type CoursePostParams = z.infer<typeof CommentValidationSchemas.coursePostParams>;
export type IdParams = z.infer<typeof CommentValidationSchemas.idParams>;
export type ContentBody = z.infer<typeof CommentValidationSchemas.contentBody>;
