import { Role } from "../../generated/prisma";
import prisma from "../../config/db";
import { TrackModel } from "./tracks.model";

jest.mock("../../config/db", () => ({
  __esModule: true,
  default: {
    track: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
    userTrack: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

describe("TrackModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("findMany", () => {
    it("finds all active tracks without search", async () => {
      const tracks = [{ id: "t-1", name: "Frontend", courses: [] }];
      (prisma.track.findMany as jest.Mock).mockResolvedValue(tracks);

      const result = await TrackModel.findMany();

      expect(prisma.track.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        include: { courses: true },
      });
      expect(result).toEqual(tracks);
    });

    it("finds tracks by search", async () => {
      const tracks = [{ id: "t-1", name: "Frontend React", courses: [] }];
      (prisma.track.findMany as jest.Mock).mockResolvedValue(tracks);

      const result = await TrackModel.findMany("react");

      expect(prisma.track.findMany).toHaveBeenCalledWith({
        where: {
          deletedAt: null,
          OR: [
            { name: { contains: "react", mode: "insensitive" } },
            { shortDescription: { contains: "react", mode: "insensitive" } },
            { longDescription: { contains: "react", mode: "insensitive" } },
          ],
        },
        include: { courses: true },
      });
      expect(result).toEqual(tracks);
    });
  });

  describe("findById", () => {
    it("finds active track by id with courses", async () => {
      const track = { id: "t-1", name: "Frontend", courses: [{ id: "c-1" }] };
      (prisma.track.findFirst as jest.Mock).mockResolvedValue(track);

      const result = await TrackModel.findById("t-1");

      expect(prisma.track.findFirst).toHaveBeenCalledWith({
        where: { id: "t-1", deletedAt: null },
        include: { courses: true },
      });
      expect(result).toEqual(track);
    });

    it("returns undefined for deleted track", async () => {
      (prisma.track.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await TrackModel.findById("t-404");

      expect(result).toBeNull();
    });
  });

  describe("findByName", () => {
    it("finds active track by name (case insensitive)", async () => {
      const track = { id: "t-1", name: "Frontend" };
      (prisma.track.findFirst as jest.Mock).mockResolvedValue(track);

      const result = await TrackModel.findByName("frontend");

      expect(prisma.track.findFirst).toHaveBeenCalledWith({
        where: {
          deletedAt: null,
          name: { equals: "frontend", mode: "insensitive" },
        },
      });
      expect(result).toEqual(track);
    });

    it("returns null when track name not found", async () => {
      (prisma.track.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await TrackModel.findByName("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("findStaff", () => {
    it("finds instructors and assistants in track", async () => {
      const staff = [
        { id: "u-1", username: "Instructor1", role: Role.INSTRUCTOR },
        { id: "u-2", username: "Assistant1", role: Role.ASSISTANT },
      ];
      (prisma.user.findMany as jest.Mock).mockResolvedValue(staff);

      const result = await TrackModel.findStaff("t-1");

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {
          role: { in: [Role.INSTRUCTOR, Role.ASSISTANT] },
          deletedAt: null,
          userTracks: { some: { trackId: "t-1", deletedAt: null } },
        },
      });
      expect(result).toEqual(staff);
    });

    it("returns empty array when no staff found", async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);

      const result = await TrackModel.findStaff("t-empty");

      expect(result).toEqual([]);
    });
  });

  describe("isUserInTrack", () => {
    it("returns true when user is in track", async () => {
      (prisma.userTrack.findFirst as jest.Mock).mockResolvedValue({ userId: "u-1" });

      const result = await TrackModel.isUserInTrack("u-1", "t-1");

      expect(prisma.userTrack.findFirst).toHaveBeenCalledWith({
        where: { userId: "u-1", trackId: "t-1", deletedAt: null },
        select: { userId: true },
      });
      expect(result).toBe(true);
    });

    it("returns false when user is not in track", async () => {
      (prisma.userTrack.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await TrackModel.isUserInTrack("u-1", "t-404");

      expect(result).toBe(false);
    });
  });

  describe("create", () => {
    it("creates new track with provided data", async () => {
      const trackData = { name: "Backend", shortDescription: "Node.js" };
      const createdTrack = { id: "t-2", ...trackData };
      (prisma.track.create as jest.Mock).mockResolvedValue(createdTrack);

      const result = await TrackModel.create(trackData);

      expect(prisma.track.create).toHaveBeenCalledWith({ data: trackData });
      expect(result).toEqual(createdTrack);
    });
  });

  describe("update", () => {
    it("updates track by id", async () => {
      const updateData = { name: "Advanced Backend" };
      const updated = { id: "t-1", name: "Advanced Backend" };
      (prisma.track.update as jest.Mock).mockResolvedValue(updated);

      const result = await TrackModel.update("t-1", updateData);

      expect(prisma.track.update).toHaveBeenCalledWith({
        where: { id: "t-1" },
        data: updateData,
      });
      expect(result).toEqual(updated);
    });
  });

  describe("delete", () => {
    it("soft deletes track by id", async () => {
      const deleted = { id: "t-1", deletedAt: expect.any(Date), creatorId: null };
      (prisma.track.update as jest.Mock).mockResolvedValue(deleted);

      const result = await TrackModel.delete("t-1");

      expect(prisma.track.update).toHaveBeenCalledWith({
        where: { id: "t-1" },
        data: { deletedAt: expect.any(Date), creatorId: null },
      });
      expect(result).toBeDefined();
    });
  });

  describe("transaction", () => {
    it("executes callback in transaction", async () => {
      const callback = jest.fn().mockResolvedValue("result");
      (prisma.$transaction as jest.Mock).mockResolvedValue("result");

      const result = await TrackModel.transaction(callback);

      expect(prisma.$transaction).toHaveBeenCalledWith(callback);
      expect(result).toBe("result");
    });
  });
});
