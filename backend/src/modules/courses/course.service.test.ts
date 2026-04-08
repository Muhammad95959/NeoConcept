import { Role } from "../../generated/prisma";
import CustomError from "../../types/customError";
import { ErrorMessages } from "../../types/errorsMessages";
import { SuccessMessages } from "../../types/successMessages";
import { CourseModel } from "./course.model";
import { CourseService } from "./course.service";

jest.mock("./course.model", () => ({
  CourseModel: {
    findTrackById: jest.fn(),
    findMany: jest.fn(),
    findById: jest.fn(),
    findUsersByIds: jest.fn(),
    findUsersAssignedToTrack: jest.fn(),
    findDuplicate: jest.fn(),
    update: jest.fn(),
    transaction: jest.fn(),
  },
}));

describe("CourseService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getMany", () => {
    it("throws when track does not exist", async () => {
      (CourseModel.findTrackById as jest.Mock).mockResolvedValue(null);

      await expect(CourseService.getMany({ track: "t-404" })).rejects.toMatchObject<Partial<CustomError>>({
        message: ErrorMessages.TRACK_NOT_FOUND,
        statusCode: 404,
      });
    });

    it("returns mapped courses with staff field", async () => {
      (CourseModel.findMany as jest.Mock).mockResolvedValue([
        {
          id: "c-1",
          name: "React",
          courseUsers: [{ userId: "u-1", roleInCourse: Role.INSTRUCTOR }],
        },
      ]);

      const result = await CourseService.getMany({ search: "react" });

      expect(CourseModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          deletedAt: null,
          OR: [
            { name: { contains: "react", mode: "insensitive" } },
            { description: { contains: "react", mode: "insensitive" } },
          ],
        }),
      );
      expect(result).toEqual([
        {
          id: "c-1",
          name: "React",
          staff: [{ userId: "u-1", roleInCourse: Role.INSTRUCTOR }],
          courseUsers: undefined,
        },
      ]);
    });
  });

  describe("get", () => {
    it("throws when course is missing", async () => {
      (CourseModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(CourseService.get("c-404")).rejects.toMatchObject<Partial<CustomError>>({
        message: ErrorMessages.COURSE_NOT_FOUND,
        statusCode: 404,
      });
    });
  });

  describe("create", () => {
    it("throws when one instructor is not assigned to track", async () => {
      (CourseModel.findTrackById as jest.Mock).mockResolvedValue({ id: "t-1" });
      (CourseModel.findUsersByIds as jest.Mock).mockResolvedValue([{ id: "i-1", role: Role.INSTRUCTOR }]);
      (CourseModel.findUsersAssignedToTrack as jest.Mock).mockResolvedValue([]);

      await expect(
        CourseService.create({
          name: "Course",
          trackId: "t-1",
          instructorIds: ["i-1"],
        }),
      ).rejects.toMatchObject<Partial<CustomError>>({
        message: ErrorMessages.INSTRUCTOR_NOT_ASSIGNED_TO_TRACK,
        statusCode: 400,
      });
    });

    it("creates course and staff inside transaction", async () => {
      const tx = {
        course: { create: jest.fn().mockResolvedValue({ id: "c-2", name: "Algorithms" }) },
        userCourse: { createMany: jest.fn().mockResolvedValue({ count: 2 }) },
      };

      (CourseModel.findTrackById as jest.Mock).mockResolvedValue({ id: "t-1" });
      (CourseModel.findUsersByIds as jest.Mock)
        .mockResolvedValueOnce([{ id: "i-1", role: Role.INSTRUCTOR }])
        .mockResolvedValueOnce([{ id: "a-1", role: Role.ASSISTANT }]);
      (CourseModel.findUsersAssignedToTrack as jest.Mock)
        .mockResolvedValueOnce([{ id: "i-1" }])
        .mockResolvedValueOnce([{ id: "a-1" }]);
      (CourseModel.findDuplicate as jest.Mock).mockResolvedValue(null);
      (CourseModel.transaction as jest.Mock).mockImplementation(async (cb: any) => cb(tx));

      const result = await CourseService.create({
        name: "  Algorithms  ",
        description: "Core CS",
        trackId: "t-1",
        instructorIds: ["i-1"],
        assistantIds: ["a-1"],
      });

      expect(tx.course.create).toHaveBeenCalledWith({
        data: {
          name: "Algorithms",
          description: "Core CS",
          trackId: "t-1",
        },
      });
      expect(tx.userCourse.createMany).toHaveBeenCalledWith({
        data: [
          { courseId: "c-2", userId: "i-1", roleInCourse: Role.INSTRUCTOR },
          { courseId: "c-2", userId: "a-1", roleInCourse: Role.ASSISTANT },
        ],
      });
      expect(result).toEqual({ id: "c-2", name: "Algorithms" });
    });

    it("creates protected course when protect is true", async () => {
      const tx = {
        course: { create: jest.fn().mockResolvedValue({ id: "c-3", name: "Protected Course" }) },
        userCourse: { createMany: jest.fn().mockResolvedValue({ count: 1 }) },
      };

      (CourseModel.findTrackById as jest.Mock).mockResolvedValue({ id: "t-1" });
      (CourseModel.findUsersByIds as jest.Mock).mockResolvedValue([{ id: "i-1", role: Role.INSTRUCTOR }]);
      (CourseModel.findUsersAssignedToTrack as jest.Mock).mockResolvedValue([{ id: "i-1" }]);
      (CourseModel.findDuplicate as jest.Mock).mockResolvedValue(null);
      (CourseModel.transaction as jest.Mock).mockImplementation(async (cb: any) => cb(tx));

      await CourseService.create({
        name: "Protected Course",
        trackId: "t-1",
        protect: true,
        instructorIds: ["i-1"],
      });

      expect(tx.course.create).toHaveBeenCalledWith({
        data: {
          name: "Protected Course",
          description: undefined,
          trackId: "t-1",
          protected: true,
        },
      });
    });
  });

  describe("update", () => {
    it("throws for duplicate course name in same track", async () => {
      (CourseModel.findById as jest.Mock).mockResolvedValue({ id: "c-1", trackId: "t-1" });
      (CourseModel.findDuplicate as jest.Mock).mockResolvedValue({ id: "c-2" });

      await expect(CourseService.update("c-1", { name: "React" })).rejects.toMatchObject<Partial<CustomError>>({
        message: ErrorMessages.DUPLICATE_COURSE_NAME,
        statusCode: 400,
      });
    });

    it("updates course protect field", async () => {
      (CourseModel.findById as jest.Mock).mockResolvedValue({ id: "c-1", trackId: "t-1" });
      (CourseModel.findDuplicate as jest.Mock).mockResolvedValue(null);
      (CourseModel.update as jest.Mock).mockResolvedValue({ id: "c-1", protected: true });

      await CourseService.update("c-1", { protect: true });

      expect(CourseModel.update).toHaveBeenCalledWith("c-1", { protected: true });
    });
  });

  describe("updateStaff", () => {
    it("returns success message when staff is updated", async () => {
      const tx = {
        userCourse: {
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          createMany: jest.fn().mockResolvedValue({ count: 2 }),
        },
      };

      (CourseModel.findById as jest.Mock).mockResolvedValue({ id: "c-1" });
      (CourseModel.findTrackById as jest.Mock).mockResolvedValue({ id: "t-1" });
      (CourseModel.findUsersByIds as jest.Mock)
        .mockResolvedValueOnce([{ id: "i-1", role: Role.INSTRUCTOR }])
        .mockResolvedValueOnce([{ id: "a-1", role: Role.ASSISTANT }]);
      (CourseModel.findUsersAssignedToTrack as jest.Mock)
        .mockResolvedValueOnce([{ id: "i-1" }])
        .mockResolvedValueOnce([{ id: "a-1" }]);
      (CourseModel.transaction as jest.Mock).mockImplementation(async (cb: any) => cb(tx));

      const result = await CourseService.updateStaff("c-1", {
        trackId: "t-1",
        instructorIds: ["i-1"],
        assistantIds: ["a-1"],
      });

      expect(tx.userCourse.updateMany).toHaveBeenCalledWith({
        where: { courseId: "c-1" },
        data: { deletedAt: expect.any(Date) },
      });
      expect(result).toEqual({ message: SuccessMessages.COURSE_STAFF_UPDATED });
    });
  });
});
