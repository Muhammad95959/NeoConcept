import { z } from "zod";

export class CourseValidationSchemas {
  static getMany = z.object({
    search: z.string().optional(),
    track: z.string().optional(),
  });

  static get = z.object({
    id: z.string(),
  });

  static create = z.object({
    name: z.string().min(1, "Course name is required"),
    description: z.string().optional(),
    protect: z.boolean().optional(),
    trackId: z.string(),
    instructorIds: z.array(z.string()).optional(),
    assistantIds: z.array(z.string()).optional(),
  });

  static updateBody = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    protect: z.boolean().optional(),
  });

  static updateParmas = z.object({
    id: z.string(),
  });

  static updateStaffBody = z.object({
    trackId: z.string(),
    instructorIds: z.array(z.string()).optional(),
    assistantIds: z.array(z.string()).optional(),
  });

  static updateStaffParams = z.object({
    id: z.string(),
  });
  
  static delete = z.object({
    id: z.string(),
  });
}
