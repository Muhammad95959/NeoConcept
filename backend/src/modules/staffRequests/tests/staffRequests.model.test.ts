import { Status } from "../../../generated/prisma";
import prisma from "../../../config/db";
import { StaffRequestModel } from "../staffRequests.model";

jest.mock("../../../config/db", () => ({
  __esModule: true,
  default: {
    userTrack: {
      findMany: jest.fn(),
    },
    staffRequest: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    course: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

describe("StaffRequestModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("findTrackIdsByUser", () => {
    it("finds track ids associated with user", async () => {
      const tracks = [{ trackId: "t-1" }, { trackId: "t-2" }];
      (prisma.userTrack.findMany as jest.Mock).mockResolvedValue(tracks);

      const result = await StaffRequestModel.findTrackIdsByUser("u-1");

      expect(prisma.userTrack.findMany).toHaveBeenCalledWith({
        where: { userId: "u-1", deletedAt: null },
        select: { trackId: true },
      });
      expect(result).toEqual(tracks);
    });

    it("returns empty array when user has no tracks", async () => {
      (prisma.userTrack.findMany as jest.Mock).mockResolvedValue([]);

      const result = await StaffRequestModel.findTrackIdsByUser("u-1");

      expect(result).toEqual([]);
    });
  });

  describe("findManyByTrackIds", () => {
    it("finds staff requests in tracks", async () => {
      const requests = [{ id: "sr-1", userId: "u-2", courseId: "c-1" }];
      (prisma.staffRequest.findMany as jest.Mock).mockResolvedValue(requests);

      const result = await StaffRequestModel.findManyByTrackIds(["t-1", "t-2"]);

      expect(prisma.staffRequest.findMany).toHaveBeenCalledWith({
        where: {
          user: {
            deletedAt: null,
            userTracks: { some: { trackId: { in: ["t-1", "t-2"] }, deletedAt: null } },
          },
        },
        include: { user: true, course: true },
      });
      expect(result).toEqual(requests);
    });
  });

  describe("findById", () => {
    it("finds request with relations by id", async () => {
      const request = { id: "sr-1", userId: "u-2", courseId: "c-1", user: {}, course: {} };
      (prisma.staffRequest.findUnique as jest.Mock).mockResolvedValue(request);

      const result = await StaffRequestModel.findById("sr-1");

      expect(prisma.staffRequest.findUnique).toHaveBeenCalledWith({
        where: { id: "sr-1" },
        include: { user: true, course: true },
      });
      expect(result).toEqual(request);
    });

    it("returns null when request not found", async () => {
      (prisma.staffRequest.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await StaffRequestModel.findById("sr-404");

      expect(result).toBeNull();
    });
  });

  describe("findCourse", () => {
    it("finds active course by id", async () => {
      const course = { id: "c-1", title: "React", deletedAt: null };
      (prisma.course.findUnique as jest.Mock).mockResolvedValue(course);

      const result = await StaffRequestModel.findCourse("c-1");

      expect(prisma.course.findUnique).toHaveBeenCalledWith({
        where: { id: "c-1", deletedAt: null },
      });
      expect(result).toEqual(course);
    });

    it("returns null for deleted or non-existent course", async () => {
      (prisma.course.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await StaffRequestModel.findCourse("c-404");

      expect(result).toBeNull();
    });
  });

  describe("findPendingRequest", () => {
    it("finds pending staff request for user and course", async () => {
      const request = { id: "sr-1", status: Status.PENDING };
      (prisma.staffRequest.findFirst as jest.Mock).mockResolvedValue(request);

      const result = await StaffRequestModel.findPendingRequest("u-1", "c-1");

      expect(prisma.staffRequest.findFirst).toHaveBeenCalledWith({
        where: { userId: "u-1", courseId: "c-1", status: Status.PENDING },
      });
      expect(result).toEqual(request);
    });

    it("returns null when no pending request exists", async () => {
      (prisma.staffRequest.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await StaffRequestModel.findPendingRequest("u-1", "c-1");

      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("creates staff request with provided data", async () => {
      const created = { id: "sr-1", userId: "u-2", courseId: "c-1", message: "test" };
      (prisma.staffRequest.create as jest.Mock).mockResolvedValue(created);

      const result = await StaffRequestModel.create({ userId: "u-2", courseId: "c-1", message: "test" });

      expect(prisma.staffRequest.create).toHaveBeenCalledWith({
        data: { userId: "u-2", courseId: "c-1", message: "test" },
      });
      expect(result).toEqual(created);
    });
  });

  describe("update", () => {
    it("updates request by id", async () => {
      const updated = { id: "sr-1", message: "updated" };
      (prisma.staffRequest.update as jest.Mock).mockResolvedValue(updated);

      const result = await StaffRequestModel.update("sr-1", { message: "updated" });

      expect(prisma.staffRequest.update).toHaveBeenCalledWith({
        where: { id: "sr-1" },
        data: { message: "updated" },
      });
      expect(result).toEqual(updated);
    });
  });

  describe("delete", () => {
    it("deletes request by id", async () => {
      const deleted = { id: "sr-1" };
      (prisma.staffRequest.delete as jest.Mock).mockResolvedValue(deleted);

      const result = await StaffRequestModel.delete("sr-1");

      expect(prisma.staffRequest.delete).toHaveBeenCalledWith({
        where: { id: "sr-1" },
      });
      expect(result).toEqual(deleted);
    });
  });

  describe("transaction", () => {
    it("executes callback in transaction", async () => {
      const callback = jest.fn();
      (prisma.$transaction as jest.Mock).mockResolvedValue("result");

      await StaffRequestModel.transaction(callback);

      expect(prisma.$transaction).toHaveBeenCalledWith(callback);
    });
  });
});
