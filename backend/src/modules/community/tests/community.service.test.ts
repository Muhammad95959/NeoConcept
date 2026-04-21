import prisma from "../../../config/db";
import CustomError from "../../../types/customError";
import { ErrorMessages } from "../../../types/errorsMessages";
import { CommunityModel } from "../community.model";
import { CommunityService } from "../community.service";
import { SocketEvents } from "../../../types/socketEvents";

jest.mock("../../../config/db", () => ({
  __esModule: true,
  default: {
    course: { findFirst: jest.fn() },
  },
}));
jest.mock("../community.model", () => ({
  CommunityModel: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));
jest.mock("../../../config/socket", () => ({
  emitToCommunity: jest.fn(),
}));

describe("CommunityService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getMany", () => {
    it("fetches messages for course", async () => {
      (CommunityModel.findMany as jest.Mock).mockResolvedValue([{ id: "m-1" }]);
      const result = await CommunityService.getMany("c-1", {});
      expect(CommunityModel.findMany).toHaveBeenCalledWith(
        { courseId: "c-1", course: { deletedAt: null } },
        { orderBy: { createdAt: "asc" } }
      );
      expect(result).toEqual([{ id: "m-1" }]);
    });
    it("throws on invalid date param", async () => {
      await expect(
        CommunityService.getMany("c-1", { date: "bad-date" })
      ).rejects.toMatchObject({ message: ErrorMessages.DATE_NOT_VALID });
    });
    it("throws on invalid before/after param", async () => {
      await expect(
        CommunityService.getMany("c-1", { before: "bad-date" })
      ).rejects.toMatchObject({ message: ErrorMessages.DATE_NOT_VALID });
      await expect(
        CommunityService.getMany("c-1", { after: "bad-date" })
      ).rejects.toMatchObject({ message: ErrorMessages.DATE_NOT_VALID });
    });
  });

  describe("get", () => {
    it("returns single message if found", async () => {
      (CommunityModel.findFirst as jest.Mock).mockResolvedValue({ id: "m-1" });
      const result = await CommunityService.get("c-1", "m-1");
      expect(CommunityModel.findFirst).toHaveBeenCalledWith({ id: "m-1", courseId: "c-1", course: { deletedAt: null } });
      expect(result).toEqual({ id: "m-1" });
    });
    it("throws if not found", async () => {
      (CommunityModel.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(CommunityService.get("c-1", "bad-id")).rejects.toMatchObject({ message: ErrorMessages.MESSAGE_NOT_FOUND });
    });
  });

  describe("create", () => {
    it("creates message with trimmed content", async () => {
      (prisma.course.findFirst as jest.Mock).mockResolvedValue({ id: "c-1" });
      (CommunityModel.create as jest.Mock).mockResolvedValue({ id: "m-1", content: "test message" });
      const result = await CommunityService.create("c-1", "  test message  ", "u-1");
      expect(prisma.course.findFirst).toHaveBeenCalledWith({ where: { id: "c-1", deletedAt: null } });
      expect(CommunityModel.create).toHaveBeenCalledWith({ content: "test message", courseId: "c-1", userId: "u-1" });
      expect(result).toEqual({ id: "m-1", content: "test message" });
    });
    it("throws if course not found", async () => {
      (prisma.course.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(
        CommunityService.create("bad-course", "Some message", "u-1")
      ).rejects.toMatchObject({ message: ErrorMessages.COURSE_NOT_FOUND });
    });
    it("throws if content invalid", async () => {
      (prisma.course.findFirst as jest.Mock).mockResolvedValue({ id: "c-1" });
      await expect(
        CommunityService.create("c-1", " ", "u-1")
      ).rejects.toMatchObject({ message: ErrorMessages.INVALID_MESSAGE_CONTENT });
    });
  });

  describe("update", () => {
    it("updates if owner", async () => {
      (CommunityModel.findFirst as jest.Mock).mockResolvedValue({ id: "m-1", userId: "u-1" });
      (CommunityModel.update as jest.Mock).mockResolvedValue({ id: "m-1", content: "new content", userId: "u-1" });
      const result = await CommunityService.update("c-1", "m-1", "new content", "u-1");
      expect(result).toEqual({ id: "m-1", content: "new content", userId: "u-1" });
    });
    it("throws if not found", async () => {
      (CommunityModel.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(
        CommunityService.update("c-1", "bad-id", "hi", "u-1")
      ).rejects.toMatchObject({ message: ErrorMessages.MESSAGE_NOT_FOUND });
    });
    it("throws if not owner", async () => {
      (CommunityModel.findFirst as jest.Mock).mockResolvedValue({ id: "m-1", userId: "other" });
      await expect(
        CommunityService.update("c-1", "m-1", "test", "u-1")
      ).rejects.toMatchObject({ message: ErrorMessages.UNAUTHORIZED });
    });
    it("throws if invalid content", async () => {
      (CommunityModel.findFirst as jest.Mock).mockResolvedValue({ id: "m-1", userId: "u-1" });
      await expect(
        CommunityService.update("c-1", "m-1", " ", "u-1")
      ).rejects.toMatchObject({ message: ErrorMessages.INVALID_MESSAGE_CONTENT });
    });
  });

  describe("delete", () => {
    it("deletes if owner", async () => {
      (CommunityModel.findFirst as jest.Mock).mockResolvedValue({ id: "m-1", userId: "u-1" });
      (CommunityModel.delete as jest.Mock).mockResolvedValue({ id: "m-1" });
      await expect(CommunityService.delete("c-1", "m-1", "u-1")).resolves.toBeUndefined();
      expect(CommunityModel.delete).toHaveBeenCalledWith("m-1");
    });
    it("throws if not found", async () => {
      (CommunityModel.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(
        CommunityService.delete("c-1", "bad-id", "u-1")
      ).rejects.toMatchObject({ message: ErrorMessages.MESSAGE_NOT_FOUND });
    });
    it("throws if not owner", async () => {
      (CommunityModel.findFirst as jest.Mock).mockResolvedValue({ id: "m-1", userId: "other" });
      await expect(
        CommunityService.delete("c-1", "m-1", "u-1")
      ).rejects.toMatchObject({ message: ErrorMessages.UNAUTHORIZED });
    });
  });
});
