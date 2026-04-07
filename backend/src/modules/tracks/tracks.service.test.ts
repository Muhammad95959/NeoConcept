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

  it("getById throws when track does not exist", async () => {
    (TrackModel.findById as jest.Mock).mockResolvedValue(null);

    await expect(TrackService.getById("t-404")).rejects.toMatchObject<Partial<CustomError>>({
      message: ErrorMessages.TRACK_NOT_FOUND,
      statusCode: 404,
    });
  });

  it("getStaff throws when user is not in track", async () => {
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

    const result = await TrackService.getStaff("t-1", "u-viewer", (user: any) => ({ id: user.id, username: user.username }));

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

  it("create throws on duplicate track name", async () => {
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

  it("delete throws when track does not exist", async () => {
    (TrackModel.findById as jest.Mock).mockResolvedValue(null);

    await expect(TrackService.delete("t-404")).rejects.toMatchObject<Partial<CustomError>>({
      message: ErrorMessages.TRACK_NOT_FOUND,
      statusCode: 404,
    });
  });
});
