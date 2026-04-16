import { z } from "zod";

export class CourseValidationSchemas {
  static getManyQuery = z.object({
    search: z.string().optional(),
    track: z.string().optional(),
  });

  static idParams = z.object({
    id: z.string(),
  });

  static createBody = z.object({
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

  static updatePrerequisitesBody = z.object({
    prerequisiteIds: z.array(z.string()).optional(),
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
}

export type GetManyQuery = z.infer<typeof CourseValidationSchemas.getManyQuery>;
export type IdParams = z.infer<typeof CourseValidationSchemas.idParams>;
export type CreateBody = z.infer<typeof CourseValidationSchemas.createBody>;
export type UpdateBody = z.infer<typeof CourseValidationSchemas.updateBody>;
export type UpdatePrerequisitesBody = z.infer<typeof CourseValidationSchemas.updatePrerequisitesBody>;
export type UpdateStaffBody = z.infer<typeof CourseValidationSchemas.updateStaffBody>;
