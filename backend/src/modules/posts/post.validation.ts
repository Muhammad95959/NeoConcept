import { z } from "zod";

export class PostValidationSchemas {
  static courseIdParam = z.object({
    courseId: z.string().uuid("Invalid course ID"),
  });

  static postIdParam = z.object({
    courseId: z.string().uuid("Invalid course ID"),
    id: z.string().uuid("Invalid post ID"),
  });

  static getPostsQuery = z.object({
    search: z.string().optional(),
  });

  static create = z.object({
    title: z.string().min(1).max(255).trim(),
    content: z.string().min(1).trim(),
  });

  static update = z
    .object({
      title: z.string().min(1).max(255).trim().optional(),
      content: z.string().min(1).trim().optional(),
    })
    .refine((data) => data.title || data.content, {
      message: "Title or content is required",
    });
}

export type CourseIdParam = z.infer<typeof PostValidationSchemas.courseIdParam>;

export type PostIdParam = z.infer<typeof PostValidationSchemas.postIdParam>;

export type GetPostsQuery = z.infer<typeof PostValidationSchemas.getPostsQuery>;

export type CreatePostInput = z.infer<typeof PostValidationSchemas.create>;

export type UpdatePostInput = z.infer<typeof PostValidationSchemas.update>;
