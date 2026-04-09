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
    prerequisiteIds: z.array(z.string()).optional(),
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

  static updatePrerequisitesParams = z.object({
    id: z.string(),
  });

  static updatePrerequisitesBody = z.object({
    prerequisiteIds: z.array(z.string()).min(1, "One or more prerequisiteIds are required"),
  });

  static updateStaffBody = z
    .object({
      trackId: z.string(),
      instructorIds: z.array(z.string()).optional(),
      assistantIds: z.array(z.string()).optional(),
    })
    .refine((data) => data.instructorIds || data.assistantIds, {
      message: "Instructor ids or assistant ids are required",
    });

  static updateStaffParams = z.object({
    id: z.string(),
  });

  static delete = z.object({
    id: z.string(),
  });
}
