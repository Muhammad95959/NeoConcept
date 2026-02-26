import { z } from "zod";

export const courseIdParamSchema = z.object({
  courseId: z.string().uuid("Invalid course ID"),
});

export const postIdParamSchema = z.object({
  courseId: z.string().uuid("Invalid course ID"),
  id: z.string().uuid("Invalid post ID"),
});

export const getPostsQuerySchema = z.object({
  search: z.string().optional(),
});

export const createPostSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(255, "Title is too long")
    .trim(),

  content: z
    .string()
    .min(1, "Content is required")
    .trim(),
});

export const updatePostSchema = z
  .object({
    title: z.string().min(1).max(255).trim().optional(),
    content: z.string().min(1).trim().optional(),
  })
  .refine((data) => data.title || data.content, {
    message: "Title or content is required",
  });
  