import { Role, Status } from "../../generated/prisma";
import prisma from "../../config/db";
import { UserModel } from "./user.model";

jest.mock("../../config/db", () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    track: {
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    userCourse: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
      updateMany: jest.fn(),
    },
    course: {
      findFirst: jest.fn(),
      updateMany: jest.fn(),
    },
    userTrack: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
      updateMany: jest.fn(),
    },
    studentRequest: {
      findMany: jest.fn(),
    },
    staffRequest: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

describe("UserModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("findById", () => {
    it("finds user by id", async () => {
      const user = { id: "u-1", username: "Test" };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);

      const result = await UserModel.findById("u-1");

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: "u-1" } });
      expect(result).toEqual(user);
    });

    it("returns undefined when user not found", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await UserModel.findById("u-404");

      expect(result).toBeNull();
    });
  });

  describe("findTrackById", () => {
    it("finds active track by id", async () => {
      const track = { id: "t-1", name: "Frontend", deletedAt: null };
      (prisma.track.findFirst as jest.Mock).mockResolvedValue(track);

      const result = await UserModel.findTrackById("t-1");

      expect(prisma.track.findFirst).toHaveBeenCalledWith({
        where: { id: "t-1", deletedAt: null },
      });
      expect(result).toEqual(track);
    });
  });

  describe("getUserCoursesModel", () => {
    it("returns user courses with related track info", async () => {
      const courses = [
        { courseId: "c-1", course: { id: "c-1", title: "React", track: { id: "t-1" } } },
      ];
      (prisma.userCourse.findMany as jest.Mock).mockResolvedValue(courses);

      const result = await UserModel.getUserCoursesModel("u-1");

      expect(prisma.userCourse.findMany).toHaveBeenCalledWith({
        where: { userId: "u-1" },
        include: { course: { include: { track: true } } },
      });
      expect(result).toEqual(courses);
    });
  });

  describe("findCourseWithInstructors", () => {
    it("finds course with instructor info", async () => {
      const course = {
        id: "c-1",
        title: "React",
        courseUsers: [{ roleInCourse: Role.INSTRUCTOR }],
      };
      (prisma.course.findFirst as jest.Mock).mockResolvedValue(course);

      const result = await UserModel.findCourseWithInstructors("c-1");

      expect(prisma.course.findFirst).toHaveBeenCalledWith({
        where: { id: "c-1", deletedAt: null },
        include: { courseUsers: { where: { roleInCourse: Role.INSTRUCTOR } } },
      });
      expect(result).toEqual(course);
    });
  });

  describe("getUserCourses", () => {
    it("returns list of course ids for user", async () => {
      const courses = [{ courseId: "c-1" }, { courseId: "c-2" }];
      (prisma.userCourse.findMany as jest.Mock).mockResolvedValue(courses);

      const result = await UserModel.getUserCourses("u-1");

      expect(prisma.userCourse.findMany).toHaveBeenCalledWith({
        where: { userId: "u-1" },
        select: { courseId: true },
      });
      expect(result).toEqual(courses);
    });
  });

  describe("findUserEnrollment", () => {
    it("finds user course enrollment", async () => {
      const enrollment = { id: "uc-1", userId: "u-1", courseId: "c-1" };
      (prisma.userCourse.findFirst as jest.Mock).mockResolvedValue(enrollment);

      const result = await UserModel.findUserEnrollment("u-1", "c-1");

      expect(prisma.userCourse.findFirst).toHaveBeenCalledWith({
        where: { userId: "u-1", courseId: "c-1" },
      });
      expect(result).toEqual(enrollment);
    });

    it("returns null when enrollment not found", async () => {
      (prisma.userCourse.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await UserModel.findUserEnrollment("u-1", "c-404");

      expect(result).toBeNull();
    });
  });

  describe("deleteUserCourse", () => {
    it("deletes user course enrollment", async () => {
      (prisma.userCourse.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

      const result = await UserModel.deleteUserCourse("u-1", "c-1");

      expect(prisma.userCourse.deleteMany).toHaveBeenCalledWith({
        where: { userId: "u-1", courseId: "c-1", deletedAt: null },
      });
      expect(result).toEqual({ count: 1 });
    });
  });

  describe("findUserTracks", () => {
    it("finds active user tracks with courses and staff", async () => {
      const tracks = [
        {
          track: {
            id: "t-1",
            name: "Frontend",
            courses: [{ id: "c-1", courseUsers: [] }],
          },
        },
      ];
      (prisma.userTrack.findMany as jest.Mock).mockResolvedValue(tracks);

      const result = await UserModel.findUserTracks("u-1");

      expect(prisma.userTrack.findMany).toHaveBeenCalledWith({
        where: { userId: "u-1", deletedAt: null },
        include: expect.any(Object),
      });
      expect(result).toEqual(tracks);
    });
  });

  describe("findUserCoursesUserTrackRequest", () => {
    it("returns user course ids", async () => {
      const courses = [{ courseId: "c-1" }, { courseId: "c-2" }];
      (prisma.userCourse.findMany as jest.Mock).mockResolvedValue(courses);

      const result = await UserModel.findUserCoursesUserTrackRequest("u-1");

      expect(result).toEqual(courses);
    });
  });

  describe("findStaffRequestsUserTrackRequest", () => {
    it("returns staff requests with course and status", async () => {
      const requests = [{ courseId: "c-1", status: Status.PENDING }];
      (prisma.staffRequest.findMany as jest.Mock).mockResolvedValue(requests);

      const result = await UserModel.findStaffRequestsUserTrackRequest("u-1");

      expect(prisma.staffRequest.findMany).toHaveBeenCalledWith({
        where: { userId: "u-1" },
        select: { courseId: true, status: true },
      });
      expect(result).toEqual(requests);
    });
  });

  describe("findStudentRequestsUserTrackRequest", () => {
    it("returns student requests with course and status", async () => {
      const requests = [{ courseId: "c-1", status: Status.APPROVED }];
      (prisma.studentRequest.findMany as jest.Mock).mockResolvedValue(requests);

      const result = await UserModel.findStudentRequestsUserTrackRequest("u-1");

      expect(prisma.studentRequest.findMany).toHaveBeenCalledWith({
        where: { userId: "u-1" },
        select: { courseId: true, status: true },
      });
      expect(result).toEqual(requests);
    });
  });

  describe("findStaffRequests", () => {
    it("finds staff requests without filters", async () => {
      const requests = [{ id: "sr-1", courseId: "c-1", status: Status.PENDING }];
      (prisma.staffRequest.findMany as jest.Mock).mockResolvedValue(requests);

      const result = await UserModel.findStaffRequests("u-1");

      expect(prisma.staffRequest.findMany).toHaveBeenCalledWith({
        where: { userId: "u-1" },
        include: { course: true },
      });
      expect(result).toEqual(requests);
    });

    it("applies status filter", async () => {
      const requests = [{ id: "sr-1", status: Status.APPROVED }];
      (prisma.staffRequest.findMany as jest.Mock).mockResolvedValue(requests);

      await UserModel.findStaffRequests("u-1", Status.APPROVED);

      expect(prisma.staffRequest.findMany).toHaveBeenCalledWith({
        where: { userId: "u-1", status: Status.APPROVED },
        include: { course: true },
      });
    });

    it("applies search filter", async () => {
      const requests = [{ id: "sr-1", message: "test" }];
      (prisma.staffRequest.findMany as jest.Mock).mockResolvedValue(requests);

      await UserModel.findStaffRequests("u-1", undefined, "test");

      expect(prisma.staffRequest.findMany).toHaveBeenCalledWith({
        where: {
          userId: "u-1",
          OR: expect.any(Array),
        },
        include: { course: true },
      });
    });
  });

  describe("findStudentRequests", () => {
    it("finds student requests without filters", async () => {
      const requests = [{ id: "str-1", courseId: "c-1", status: Status.PENDING }];
      (prisma.studentRequest.findMany as jest.Mock).mockResolvedValue(requests);

      const result = await UserModel.findStudentRequests("u-1");

      expect(prisma.studentRequest.findMany).toHaveBeenCalledWith({
        where: { userId: "u-1" },
        include: { course: true },
      });
      expect(result).toEqual(requests);
    });

    it("applies status filter", async () => {
      const requests = [{ id: "str-1", status: Status.APPROVED }];
      (prisma.studentRequest.findMany as jest.Mock).mockResolvedValue(requests);

      await UserModel.findStudentRequests("u-1", Status.APPROVED);

      expect(prisma.studentRequest.findMany).toHaveBeenCalledWith({
        where: { userId: "u-1", status: Status.APPROVED },
        include: { course: true },
      });
    });

    it("applies search filter", async () => {
      const requests = [{ id: "str-1", message: "test" }];
      (prisma.studentRequest.findMany as jest.Mock).mockResolvedValue(requests);

      await UserModel.findStudentRequests("u-1", undefined, "physics");

      expect(prisma.studentRequest.findMany).toHaveBeenCalledWith({
        where: {
          userId: "u-1",
          OR: expect.any(Array),
        },
        include: { course: true },
      });
    });
  });

  describe("createUserCourse", () => {
    it("creates user course with role", async () => {
      (prisma.userCourse.create as jest.Mock).mockResolvedValue({
        id: "uc-1",
        userId: "u-1",
        courseId: "c-1",
        roleInCourse: Role.STUDENT,
      });

      const result = await UserModel.createUserCourse("u-1", "c-1", Role.STUDENT);

      expect(prisma.userCourse.create).toHaveBeenCalledWith({
        data: { userId: "u-1", courseId: "c-1", roleInCourse: Role.STUDENT },
      });
      expect(result.roleInCourse).toBe(Role.STUDENT);
    });
  });

  describe("updateById", () => {
    it("updates user by id", async () => {
      const updated = { id: "u-1", username: "Updated" };
      (prisma.user.update as jest.Mock).mockResolvedValue(updated);

      const result = await UserModel.updateById("u-1", { username: "Updated" });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "u-1" },
        data: { username: "Updated" },
      });
      expect(result).toEqual(updated);
    });
  });

  describe("upsertUserTrack", () => {
    it("upserts user track via transaction", async () => {
      const tx = { userTrack: { upsert: jest.fn() } };
      const result = { userId: "u-1", trackId: "t-1" };
      (tx.userTrack.upsert as jest.Mock).mockResolvedValue(result);

      const res = await UserModel.upsertUserTrack(tx, "u-1", "t-1");

      expect(tx.userTrack.upsert).toHaveBeenCalledWith({
        where: expect.any(Object),
        update: {},
        create: { userId: "u-1", trackId: "t-1" },
      });
      expect(res).toEqual(result);
    });
  });

  describe("deleteUserTrack", () => {
    it("deletes user track via transaction", async () => {
      const tx = { userTrack: { deleteMany: jest.fn() } };
      (tx.userTrack.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

      const result = await UserModel.deleteUserTrack(tx, "u-1", "t-1");

      expect(tx.userTrack.deleteMany).toHaveBeenCalledWith({
        where: { userId: "u-1", trackId: "t-1", deletedAt: null },
      });
      expect(result).toEqual({ count: 1 });
    });
  });

  describe("deleteUserWithRelations", () => {
    it("deletes user and relations for non-admin", async () => {
      const mockTx = {
        user: { update: jest.fn().mockResolvedValue({}) },
        userTrack: { updateMany: jest.fn().mockResolvedValue({}) },
        userCourse: { updateMany: jest.fn().mockResolvedValue({}) },
        track: { findFirst: jest.fn().mockResolvedValue(null) },
      };

      (prisma.$transaction as jest.Mock).mockImplementation(async (cb) => cb(mockTx));

      const user = { id: "u-1", role: Role.STUDENT, deletedAt: null };
      await UserModel.deleteUserWithRelations(user);

      expect(mockTx.user.update).toHaveBeenCalled();
      expect(mockTx.userTrack.updateMany).toHaveBeenCalled();
      expect(mockTx.userCourse.updateMany).toHaveBeenCalled();
    });

    it("deletes user and created tracks for admin", async () => {
      const mockTx = {
        user: { update: jest.fn().mockResolvedValue({}) },
        userTrack: { updateMany: jest.fn().mockResolvedValue({}) },
        userCourse: { updateMany: jest.fn().mockResolvedValue({}) },
        track: {
          findFirst: jest.fn().mockResolvedValue({ id: "t-1" }),
          update: jest.fn().mockResolvedValue({}),
          updateMany: jest.fn().mockResolvedValue({}),
        },
        course: { updateMany: jest.fn().mockResolvedValue({}) },
      };

      (prisma.$transaction as jest.Mock).mockImplementation(async (cb) => cb(mockTx));

      const user = { id: "u-1", role: Role.ADMIN, deletedAt: null };
      await UserModel.deleteUserWithRelations(user);

      expect(mockTx.track.findFirst).toHaveBeenCalled();
      expect(mockTx.track.update).toHaveBeenCalled();
      expect(mockTx.course.updateMany).toHaveBeenCalled();
    });
  });

  describe("transaction", () => {
    it("executes callback in transaction", async () => {
      const callback = jest.fn();
      (prisma.$transaction as jest.Mock).mockResolvedValue("result");

      await UserModel.transaction(callback);

      expect(prisma.$transaction).toHaveBeenCalledWith(callback);
    });
  });
});
