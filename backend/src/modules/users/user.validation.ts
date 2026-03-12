import { z } from "zod";
import { Status } from "../../generated/prisma";

export class UserValidationSchemas {
  static updateUser = z
    .object({
      username: z.string().trim().min(1).optional(),
      password: z.string().min(6).optional(),
    })
    .refine((data) => data.username || data.password, {
      message: "Username or password is required",
      path: ["body"],
    });
  static courseIdBody = z.object({
    courseId: z.string().uuid("Invalid course id"),
  });

  static trackIdBody = z.object({
    trackId: z.string().uuid("Invalid track id"),
  });

  static quitTrack = z.object({
    trackId: z.string().uuid("Invalid track id"),
  });

  static getUserStaffRequests = z.object({
    status: z.nativeEnum(Status).optional(),
    search: z.string().optional(),
  });

  static getUserStudentRequests = z.object({
    status: z.nativeEnum(Status).optional(),
    search: z.string().optional(),
  });
}

export type UpdateUserInput = z.infer<typeof UserValidationSchemas.updateUser>;
export type CourseIdBody = z.infer<typeof UserValidationSchemas.courseIdBody>;
export type TrackIdBody = z.infer<typeof UserValidationSchemas.trackIdBody>;
export type QuitTrackInput = z.infer<typeof UserValidationSchemas.quitTrack>;
export type GetUserStaffRequestsQuery = z.infer<typeof UserValidationSchemas.getUserStaffRequests>;
export type GetUserStudentRequestsQuery = z.infer<typeof UserValidationSchemas.getUserStudentRequests>;
