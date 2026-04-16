import { z } from "zod";

export class MeetingValidationSchemas {
  static courseIdParams = z.object({
    courseId: z.string().uuid("Invalid course ID"),
  });

  static meetingIdParams = z.object({
    meetingId: z.string().uuid("Invalid meeting ID"),
  });

  static idParams = z.object({
    id: z.string().uuid("Invalid ID"),
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
    meetingId: z.string().min(1, "Meeting ID is required"),
    userId: z.string().min(1, "User ID is required"),
  });
}

export type CourseIdParams = z.infer<typeof MeetingValidationSchemas.courseIdParams>;
export type MeetingIdParams = z.infer<typeof MeetingValidationSchemas.meetingIdParams>;
export type IdParams = z.infer<typeof MeetingValidationSchemas.idParams>;
export type CreateBody = z.infer<typeof MeetingValidationSchemas.createBody>;
export type UpdateBody = z.infer<typeof MeetingValidationSchemas.updateBody>;
export type RemoveParticipantParams = z.infer<typeof MeetingValidationSchemas.removeParticipantParams>;
