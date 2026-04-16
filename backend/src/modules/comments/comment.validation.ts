import z from "zod";

export class CommentValidationSchemas {
  static postIdParams = z.object({
    postId: z.string().uuid("Invalid post ID"),
  });

  static idParams = z.object({
    postId: z.string().uuid("Invalid post ID"),
    id: z.string().uuid("Invalid comment ID"),
  });

  static contentBody = z.object({
    content: z.string().min(1).trim(),
  });
}

export type PostIdParams = z.infer<typeof CommentValidationSchemas.postIdParams>;
export type IdParams = z.infer<typeof CommentValidationSchemas.idParams>;
export type ContentBody = z.infer<typeof CommentValidationSchemas.contentBody>;
