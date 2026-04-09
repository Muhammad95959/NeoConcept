import CustomError from "../../types/customError";
import { ErrorMessages } from "../../types/errorsMessages";
import { TrackModel } from "./tracks.model";
import { TrackService } from "./tracks.service";

jest.mock("./tracks.model", () => ({
  TrackModel: {
    findMany: jest.fn(),
    findById: jest.fn(),
    isUserInTrack: jest.fn(),
    findStaff: jest.fn(),
    findByName: jest.fn(),
    update: jest.fn(),
    transaction: jest.fn(),
  },
}));

describe("TrackService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getMany", () => {
    it("returns all tracks without search", async () => {
      const tracks = [{ id: "t-1", name: "Frontend" }];
      (TrackModel.findMany as jest.Mock).mockResolvedValue(tracks);

      const result = await TrackService.getMany();

      expect(TrackModel.findMany).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(tracks);
    });

    it("returns tracks matching search", async () => {
      const tracks = [{ id: "t-1", name: "Frontend React" }];
      (TrackModel.findMany as jest.Mock).mockResolvedValue(tracks);

      const result = await TrackService.getMany("react");

      expect(TrackModel.findMany).toHaveBeenCalledWith("react");
      expect(result).toEqual(tracks);
    });
  });

  describe("getById", () => {
    it("returns track when found", async () => {
      const track = { id: "t-1", name: "Frontend" };
      (TrackModel.findById as jest.Mock).mockResolvedValue(track);

      const result = await TrackService.getById("t-1");

      expect(TrackModel.findById).toHaveBeenCalledWith("t-1");
      expect(result).toEqual(track);
    });

    it("throws when track does not exist", async () => {
      (TrackModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(TrackService.getById("t-404")).rejects.toMatchObject<Partial<CustomError>>({
        message: ErrorMessages.TRACK_NOT_FOUND,
        statusCode: 404,
      });
    });
  });

  describe("getStaff", () => {
    it("throws when track does not exist", async () => {
      (TrackModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(TrackService.getStaff("t-404", "u-1", (u: any) => u)).rejects.toMatchObject<Partial<CustomError>>({
        message: ErrorMessages.TRACK_NOT_FOUND,
        statusCode: 404,
      });
    });

    it("throws when user is not in track", async () => {
      (TrackModel.findById as jest.Mock).mockResolvedValue({ id: "t-1" });
      (TrackModel.isUserInTrack as jest.Mock).mockResolvedValue(false);

      await expect(TrackService.getStaff("t-1", "u-1", (u: any) => u)).rejects.toMatchObject<Partial<CustomError>>({
        message: ErrorMessages.YOU_DONT_HAVE_PERMISSION_TO_VIEW_THE_STAFF_OF_THIS_TRACK,
        statusCode: 403,
      });
    });

    it("getStaff filters unconfirmed users and strips fields", async () => {
      (TrackModel.findById as jest.Mock).mockResolvedValue({ id: "t-1" });
      (TrackModel.isUserInTrack as jest.Mock).mockResolvedValue(true);
      (TrackModel.findStaff as jest.Mock).mockResolvedValue([
        { id: "u-1", username: "I1", emailConfirmed: true, googleId: "g-1", deletedAt: null },
        { id: "u-2", username: "I2", emailConfirmed: false, googleId: "g-2", deletedAt: null },
      ]);

      const result = await TrackService.getStaff("t-1", "u-viewer", (user: any) => ({
        id: user.id,
        username: user.username,
      }));

      expect(result).toEqual([
        {
          id: "u-1",
          username: "I1",
          googleId: undefined,
          emailConfirmed: undefined,
          deletedAt: undefined,
        },
      ]);
    });
  });

  describe("create", () => {
    it("throws on duplicate track name", async () => {
      (TrackModel.findByName as jest.Mock).mockResolvedValue({ id: "t-old" });

      await expect(
        TrackService.create("u-1", {
          name: "Frontend",
          shortDescription: "short",
          longDescription: "long",
          domain: "web",
          level: "beginner",
          language: "en",
          targetAudience: "students",
          pricingModel: "free",
        }),
      ).rejects.toMatchObject<Partial<CustomError>>({
        message: ErrorMessages.DUPLICATE_TRACK_NAME,
        statusCode: 400,
      });
    });

    it("create trims payload and creates creator membership", async () => {
      const tx = {
        track: { create: jest.fn().mockResolvedValue({ id: "t-1", name: "Frontend" }) },
        userTrack: { create: jest.fn().mockResolvedValue({}) },
      };

      (TrackModel.findByName as jest.Mock).mockResolvedValue(null);
      (TrackModel.transaction as jest.Mock).mockImplementation(async (cb: any) => cb(tx));

      const result = await TrackService.create("u-1", {
        name: " Frontend ",
        shortDescription: " Short ",
        longDescription: " Long ",
        domain: " Web ",
        level: " Beginner ",
        language: " EN ",
        targetAudience: " Students ",
        pricingModel: " Free ",
      });

      expect(tx.track.create).toHaveBeenCalledWith({
        data: {
          name: "Frontend",
          shortDescription: "Short",
          longDescription: "Long",
          domain: "Web",
          level: "Beginner",
          language: "EN",
          targetAudience: "Students",
          pricingModel: "Free",
          creatorId: "u-1",
        },
      });
      expect(tx.userTrack.create).toHaveBeenCalledWith({ data: { userId: "u-1", trackId: "t-1" } });
      expect(result).toEqual({ id: "t-1", name: "Frontend" });
    });
  });

  describe("update", () => {
    it("throws when track does not exist", async () => {
      (TrackModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(TrackService.update("t-404", { name: "Updated" })).rejects.toMatchObject<Partial<CustomError>>({
        message: ErrorMessages.TRACK_NOT_FOUND,
        statusCode: 404,
      });
    });

    it("throws on duplicate track name update", async () => {
      (TrackModel.findById as jest.Mock).mockResolvedValue({ id: "t-1", name: "Frontend" });
      (TrackModel.findByName as jest.Mock).mockResolvedValue({ id: "t-2", name: "Backend" });

      await expect(TrackService.update("t-1", { name: "Backend" })).rejects.toMatchObject<Partial<CustomError>>({
        message: ErrorMessages.DUPLICATE_TRACK_NAME,
        statusCode: 400,
      });
    });

    it("allows name update if same track", async () => {
      (TrackModel.findById as jest.Mock).mockResolvedValue({ id: "t-1", name: "Frontend" });
      (TrackModel.findByName as jest.Mock).mockResolvedValue({ id: "t-1", name: "Frontend" });
      (TrackModel.update as jest.Mock).mockResolvedValue({ id: "t-1", name: "Frontend" });

      const result = await TrackService.update("t-1", { name: "Frontend" });

      expect(TrackModel.update).toHaveBeenCalledWith("t-1", { name: "Frontend" });
      expect(result).toEqual({ id: "t-1", name: "Frontend" });
    });

    it("updates multiple fields with trimming", async () => {
      (TrackModel.findById as jest.Mock).mockResolvedValue({ id: "t-1" });
      (TrackModel.findByName as jest.Mock).mockResolvedValue(null);
      (TrackModel.update as jest.Mock).mockResolvedValue({ id: "t-1" });

      await TrackService.update("t-1", {
        name: " Updated ",
        shortDescription: " New Short ",
        longDescription: " New Long ",
        level: " advanced ",
        learningOutcomes: ["outcome1"],
        relatedJobs: ["job1"],
      });

      expect(TrackModel.update).toHaveBeenCalledWith(
        "t-1",
        expect.objectContaining({
          name: "Updated",
          shortDescription: "New Short",
          longDescription: "New Long",
          level: "advanced",
          learningOutcomes: ["outcome1"],
          relatedJobs: ["job1"],
        }),
      );
    });
  });

  describe("delete", () => {
    it("throws when track does not exist", async () => {
      (TrackModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(TrackService.delete("t-404")).rejects.toMatchObject<Partial<CustomError>>({
        message: ErrorMessages.TRACK_NOT_FOUND,
        statusCode: 404,
      });
    });

    it("deletes track with all related records in transaction", async () => {
      const tx = {
        track: { update: jest.fn().mockResolvedValue({}) },
        course: { updateMany: jest.fn().mockResolvedValue({}) },
        userTrack: { updateMany: jest.fn().mockResolvedValue({}) },
      };

      (TrackModel.findById as jest.Mock).mockResolvedValue({ id: "t-1" });
      (TrackModel.transaction as jest.Mock).mockImplementation(async (cb: any) => cb(tx));

      await TrackService.delete("t-1");

      expect(tx.track.update).toHaveBeenCalledWith({
        where: { id: "t-1" },
        data: { deletedAt: expect.any(Date), creatorId: null },
      });
      expect(tx.course.updateMany).toHaveBeenCalledWith({
        where: { trackId: "t-1" },
        data: { deletedAt: expect.any(Date) },
      });
      expect(tx.userTrack.updateMany).toHaveBeenCalledWith({
        where: { trackId: "t-1" },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });
});
