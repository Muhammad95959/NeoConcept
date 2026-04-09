import { Role, Status } from "../../generated/prisma";
import prisma from "../../config/db";
import { StudentRequestModel } from "./studentRequests.model";

jest.mock("../../config/db", () => ({
  __esModule: true,
  default: {
    studentRequest: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    course: {
      findUnique: jest.fn(),
    },
    userCourse: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

describe("StudentRequestModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("findById", () => {
    it("finds request by id", async () => {
      const request = { id: "st-1", userId: "u-1", courseId: "c-1", status: Status.PENDING };
      (prisma.studentRequest.findUnique as jest.Mock).mockResolvedValue(request);

      const result = await StudentRequestModel.findById("st-1");

      expect(prisma.studentRequest.findUnique).toHaveBeenCalledWith({
        where: { id: "st-1" },
      });
      expect(result).toEqual(request);
    });

    it("returns null when request not found", async () => {
      (prisma.studentRequest.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await StudentRequestModel.findById("st-404");

      expect(result).toBeNull();
    });
  });

  describe("findCourse", () => {
    it("finds active course by id", async () => {
      const course = { id: "c-1", title: "React", deletedAt: null };
      (prisma.course.findUnique as jest.Mock).mockResolvedValue(course);

      const result = await StudentRequestModel.findCourse("c-1");

      expect(prisma.course.findUnique).toHaveBeenCalledWith({
        where: { id: "c-1", deletedAt: null },
      });
      expect(result).toEqual(course);
    });

    it("returns null for deleted or non-existent course", async () => {
      (prisma.course.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await StudentRequestModel.findCourse("c-404");

      expect(result).toBeNull();
    });
  });

  describe("findStaffMember", () => {
    it("finds staff member in course", async () => {
      const staffMember = { id: "uc-1", userId: "u-1", courseId: "c-1", roleInCourse: Role.INSTRUCTOR };
      (prisma.userCourse.findFirst as jest.Mock).mockResolvedValue(staffMember);

      const result = await StudentRequestModel.findStaffMember("c-1", "u-staff");

      expect(prisma.userCourse.findFirst).toHaveBeenCalledWith({
        where: {
          courseId: "c-1",
          userId: "u-staff",
          roleInCourse: { in: [Role.INSTRUCTOR, Role.ASSISTANT] },
        },
      });
      expect(result).toEqual(staffMember);
    });

    it("returns null when user is not staff in course", async () => {
      (prisma.userCourse.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await StudentRequestModel.findStaffMember("c-1", "u-student");

      expect(result).toBeNull();
    });
  });

  describe("findEnrollment", () => {
    it("finds user course enrollment", async () => {
      const enrollment = { id: "uc-1", userId: "u-1", courseId: "c-1" };
      (prisma.userCourse.findFirst as jest.Mock).mockResolvedValue(enrollment);

      const result = await StudentRequestModel.findEnrollment("u-1", "c-1");

      expect(prisma.userCourse.findFirst).toHaveBeenCalledWith({
        where: { userId: "u-1", courseId: "c-1" },
      });
      expect(result).toEqual(enrollment);
    });

    it("returns null when user not enrolled", async () => {
      (prisma.userCourse.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await StudentRequestModel.findEnrollment("u-1", "c-1");

      expect(result).toBeNull();
    });
  });

  describe("findPendingRequest", () => {
    it("finds pending student request for user and course", async () => {
      const request = { id: "st-1", status: Status.PENDING };
      (prisma.studentRequest.findFirst as jest.Mock).mockResolvedValue(request);

      const result = await StudentRequestModel.findPendingRequest("u-1", "c-1");

      expect(prisma.studentRequest.findFirst).toHaveBeenCalledWith({
        where: { userId: "u-1", courseId: "c-1", status: Status.PENDING },
      });
      expect(result).toEqual(request);
    });

    it("returns null when no pending request exists", async () => {
      (prisma.studentRequest.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await StudentRequestModel.findPendingRequest("u-1", "c-1");

      expect(result).toBeNull();
    });
  });

  describe("findManyByCourse", () => {
    it("finds all requests for course without status filter", async () => {
      const requests = [
        { id: "st-1", status: Status.PENDING },
        { id: "st-2", status: Status.APPROVED },
      ];
      (prisma.studentRequest.findMany as jest.Mock).mockResolvedValue(requests);

      const result = await StudentRequestModel.findManyByCourse("c-1");

      expect(prisma.studentRequest.findMany).toHaveBeenCalledWith({
        where: { courseId: "c-1", status: undefined },
      });
      expect(result).toEqual(requests);
    });

    it("finds requests for course with status filter", async () => {
      const requests = [{ id: "st-1", status: Status.PENDING }];
      (prisma.studentRequest.findMany as jest.Mock).mockResolvedValue(requests);

      const result = await StudentRequestModel.findManyByCourse("c-1", Status.PENDING);

      expect(prisma.studentRequest.findMany).toHaveBeenCalledWith({
        where: { courseId: "c-1", status: Status.PENDING },
      });
      expect(result).toEqual(requests);
    });
  });

  describe("create", () => {
    it("creates student request with provided data", async () => {
      const created = { id: "st-1", userId: "u-1", courseId: "c-1" };
      (prisma.studentRequest.create as jest.Mock).mockResolvedValue(created);

      const result = await StudentRequestModel.create({ userId: "u-1", courseId: "c-1" });

      expect(prisma.studentRequest.create).toHaveBeenCalledWith({
        data: { userId: "u-1", courseId: "c-1" },
      });
      expect(result).toEqual(created);
    });
  });

  describe("delete", () => {
    it("deletes request by id", async () => {
      const deleted = { id: "st-1" };
      (prisma.studentRequest.delete as jest.Mock).mockResolvedValue(deleted);

      const result = await StudentRequestModel.delete("st-1");

      expect(prisma.studentRequest.delete).toHaveBeenCalledWith({
        where: { id: "st-1" },
      });
      expect(result).toEqual(deleted);
    });
  });

  describe("transaction", () => {
    it("executes callback in transaction", async () => {
      const callback = jest.fn();
      (prisma.$transaction as jest.Mock).mockResolvedValue("result");

      await StudentRequestModel.transaction(callback);

      expect(prisma.$transaction).toHaveBeenCalledWith(callback);
    });
  });
});
