import { z } from "zod";

export class CourseValidationSchemas {
  static getManyQuery = z.object({
    search: z.string().optional(),
    track: z.string().optional(),
  });

  static getByIdParams = z.object({
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

  static updateParams = z.object({
    id: z.string(),
  });

  static updatePrerequisitesBody = z.object({
    prerequisiteIds: z.array(z.string()).optional(),
  });

  static updatePrerequisitesParams = z.object({
    id: z.string(),
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

  static deleteParams = z.object({
    id: z.string(),
  });
}

export type GetManyQuery = z.infer<typeof CourseValidationSchemas.getManyQuery>;
export type GetByIdParams = z.infer<typeof CourseValidationSchemas.getByIdParams>;
export type CreateBody = z.infer<typeof CourseValidationSchemas.createBody>;
export type UpdateBody = z.infer<typeof CourseValidationSchemas.updateBody>;
export type UpdateParams = z.infer<typeof CourseValidationSchemas.updateParams>;
export type UpdatePrerequisitesBody = z.infer<typeof CourseValidationSchemas.updatePrerequisitesBody>;
export type UpdatePrerequisitesParams = z.infer<typeof CourseValidationSchemas.updatePrerequisitesParams>;
export type UpdateStaffBody = z.infer<typeof CourseValidationSchemas.updateStaffBody>;
export type UpdateStaffParams = z.infer<typeof CourseValidationSchemas.updateStaffParams>;
export type DeleteParams = z.infer<typeof CourseValidationSchemas.deleteParams>;
