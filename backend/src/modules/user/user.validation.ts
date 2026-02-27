import { z } from "zod";
import { Status } from "../../generated/prisma";

export const updateUserSchema = z
  .object({
    body: z.object({
      username: z.string().trim().min(1).optional(),
      password: z.string().min(6).optional(),
    }),
  })
  .refine((data) => data.body.username || data.body.password, {
    message: "Username or password is required",
    path: ["body"],
  });

export const quitCourseSchema = z.object({
  body: z.object({
    courseId: z.string().uuid("Invalid course id"),
  }),
});

export const getUserStaffRequestsSchema = z.object({
  query: z.object({
    status: z.nativeEnum(Status).optional(),
    search: z.string().optional(),
  }),
});

export const getUserStudentRequestsSchema = z.object({
  query: z.object({
    status: z.nativeEnum(Status).optional(),
    search: z.string().optional(),
  }),
});

export const selectTrackSchema = z.object({
  body: z.object({
    trackId: z.string().uuid("Invalid track id"),
  }),
});

export const quitTrackSchema = z.object({
  body: z.object({
    trackId: z.string().uuid("Invalid track id"),
  }),
});

export const joinCourseSchema = z.object({
  body: z.object({
    courseId: z.string().uuid("Invalid course id"),
  }),
});
export const deleteUserSchema = z.object({
  body: z.object({}).optional(),
});