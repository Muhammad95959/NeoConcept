import { Status } from "../../generated/prisma";

export type UpdateUserInputService = {
  userId: string;
  username?: string;
  password?: string;
  deletedAt?: Date | null;
};

export type TracksServicesInput = {
  user: any;
  trackId: string;
};

export type GetUserCoursesInput = {
  userId: string;
};

export type GetUserStaffRequestsInput = {
  user: any;
  status?: Status;
  search?: string;
};

export type CoursesServicesInput = {
  user: any;
  courseId: string;
};
