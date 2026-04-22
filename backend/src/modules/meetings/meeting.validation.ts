import { z } from "zod";

export class MeetingValidationSchemas {
  static courseIdParams = z.object({
    courseId: z.string().uuid("Invalid course ID"),
  });

  static idParams = z.object({
    courseId: z.string().uuid("Invalid course ID"),
    id: z.string().uuid("Invalid meeting ID"),
  });

  static createBody = z.object({
    title: z
      .string()
      .trim()
      .min(3, "Title must be at least 3 characters")
      .max(100, "Title must not exceed 100 characters"),

    channelName: z
      .string()
      .trim()
      .min(3, "Channel Name must be at least 3 characters")
      .max(100, "Channel Name must not exceed 100 characters")
      .optional(),

    scheduledAt: z.string().datetime({ message: "Invalid date format" }).optional(),
  });

  static updateBody = z.object({
    title: z
      .string()
      .trim()
      .min(3, "Title must be at least 3 characters")
      .max(100, "Title must not exceed 100 characters")
      .optional(),

    channelName: z
      .string()
      .trim()
      .min(3, "Channel Name must be at least 3 characters")
      .max(100, "Channel Name must not exceed 100 characters")
      .optional(),

    scheduledAt: z.string().datetime({ message: "Invalid date format" }).optional(),

    status: z.enum(["SCHEDULED", "LIVE", "ENDED"]).optional(),
  });

  static removeParticipantParams = z.object({
    id: z.string().uuid("Invalid meeting ID"),
    userId: z.string().min(1, "User ID is required"),
    courseId: z.string().uuid("Invalid course ID"),
  });
}

export type CourseIdParams = z.infer<typeof MeetingValidationSchemas.courseIdParams>;
export type IdParams = z.infer<typeof MeetingValidationSchemas.idParams>;
export type CreateBody = z.infer<typeof MeetingValidationSchemas.createBody>;
export type UpdateBody = z.infer<typeof MeetingValidationSchemas.updateBody>;
export type RemoveParticipantParams = z.infer<typeof MeetingValidationSchemas.removeParticipantParams>;
