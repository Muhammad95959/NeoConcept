import { z } from "zod";

export const createMeetingSchema = z.object({
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

  scheduledAt: z
    .string()
    .datetime({ message: "Invalid date format" })
    .optional(),
});

export type CreateMeetingInput = z.infer<typeof createMeetingSchema>;

export const updateMeetingSchema = z.object({
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

  scheduledAt: z
    .string()
    .datetime({ message: "Invalid date format" })
    .optional(),

  status: z.enum(["SCHEDULED", "LIVE", "ENDED"]).optional(),
});

export type UpdateMeetingInput = z.infer<typeof updateMeetingSchema>;

export const meetingIdParamSchema = z.object({
  meetingId: z.string().uuid("Invalid meeting ID"),
});

export type MeetingIdParam = z.infer<typeof meetingIdParamSchema>;

export const idParamSchema = z.object({
  id: z.string().uuid("Invalid ID"),
});

export type IdParam = z.infer<typeof idParamSchema>;

export const addParticipantSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

export type AddParticipantInput = z.infer<typeof addParticipantSchema>;

export const removeParticipantParamSchema = z.object({
  meetingId: z.string().min(1, "Meeting ID is required"),
  userId: z.string().min(1, "User ID is required"),
});

export type RemoveParticipantParam = z.infer<
  typeof removeParticipantParamSchema
>;

// export const paginationQuerySchema = z.object({
//   page: z.coerce.number().min(1).default(1),
//   limit: z.coerce.number().min(1).max(100).default(10),
// });

// export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
