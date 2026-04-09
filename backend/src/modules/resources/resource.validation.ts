import { z } from "zod";

export class ResourceValidationSchemas {
  static getMany = z.object({
    courseId: z.string(),
  });

  static get = z.object({
    courseId: z.string(),
    id: z.string(),
  });

  static upload = z.object({
    courseId: z.string(),
  });

  static delete = z.object({
    courseId: z.string(),
    id: z.string(),
  });

  static download = z.object({
    courseId: z.string(),
    id: z.string(),
  });
}
