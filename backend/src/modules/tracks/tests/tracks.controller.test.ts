import { Request, Response } from "express";
import safeUserData from "../../../utils/safeUserData";
import { HTTPStatusText } from "../../../types/HTTPStatusText";
import { SuccessMessages } from "../../../types/successMessages";
import { TrackController } from "../tracks.controller";
import { TrackService } from "../tracks.service";

jest.mock("./tracks.service", () => ({
  TrackService: {
    getMany: jest.fn(),
    getById: jest.fn(),
    getStaff: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock("../../utils/safeUserData", () => jest.fn());

const createMockRes = () => {
  const res: Partial<Response> = {
    locals: {},
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };

  return res as Response;
};

describe("TrackController", () => {
  const next = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getTracks returns tracks", async () => {
    const req = {} as Request;
    const res = createMockRes();
    const data = [{ id: "t-1" }];
    res.locals = { query: { search: "front" } };
    (TrackService.getMany as jest.Mock).mockResolvedValue(data);

    await TrackController.getTracks(req, res, next);

    expect(TrackService.getMany).toHaveBeenCalledWith("front");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: HTTPStatusText.SUCCESS, data });
  });

  it("getTrackById returns single track", async () => {
    const req = {} as Request;
    const res = createMockRes();
    const data = { id: "t-1", name: "Frontend" };
    res.locals = { params: { id: "t-1" } };
    (TrackService.getById as jest.Mock).mockResolvedValue(data);

    await TrackController.getTrackById(req, res, next);

    expect(TrackService.getById).toHaveBeenCalledWith("t-1");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: HTTPStatusText.SUCCESS, data });
  });

  it("getTrackStaff passes safeUserData to service", async () => {
    const req = {} as Request;
    const res = createMockRes();
    const data = [{ id: "u-1" }];
    res.locals = { params: { id: "t-1" }, user: { id: "u-viewer" } };
    (TrackService.getStaff as jest.Mock).mockResolvedValue(data);

    await TrackController.getTrackStaff(req, res, next);

    expect(TrackService.getStaff).toHaveBeenCalledWith("t-1", "u-viewer", safeUserData);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: HTTPStatusText.SUCCESS, data });
  });

  it("createTrack returns created track", async () => {
    const req = {} as Request;
    const res = createMockRes();
    const data = { id: "t-2" };
    res.locals = { user: { id: "u-1" }, body: { name: "Frontend" } };
    (TrackService.create as jest.Mock).mockResolvedValue(data);

    await TrackController.createTrack(req, res, next);

    expect(TrackService.create).toHaveBeenCalledWith("u-1", { name: "Frontend" });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ status: HTTPStatusText.SUCCESS, data });
  });

  it("updateTrack returns updated track", async () => {
    const req = {} as Request;
    const res = createMockRes();
    const data = { id: "t-1", name: "UpdatedFrontend" };
    res.locals = { params: { id: "t-1" }, body: { name: "UpdatedFrontend" } };
    (TrackService.update as jest.Mock).mockResolvedValue(data);

    await TrackController.updateTrack(req, res, next);

    expect(TrackService.update).toHaveBeenCalledWith("t-1", { name: "UpdatedFrontend" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: HTTPStatusText.SUCCESS, data });
  });

  it("deleteTrack returns deleted message", async () => {
    const req = {} as Request;
    const res = createMockRes();
    res.locals = { params: { id: "t-1" } };

    await TrackController.deleteTrack(req, res, next);

    expect(TrackService.delete).toHaveBeenCalledWith("t-1");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: HTTPStatusText.SUCCESS,
      message: SuccessMessages.TRACK_DELETED,
    });
  });

  describe("error handling", () => {
    it("getTracks forwards errors to next", async () => {
      const req = {} as Request;
      const res = createMockRes();
      const error = new Error("service failed");
      res.locals = { query: {} };
      (TrackService.getMany as jest.Mock).mockRejectedValue(error);

      await TrackController.getTracks(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it("getTrackById forwards errors to next", async () => {
      const req = {} as Request;
      const res = createMockRes();
      const error = new Error("service failed");
      res.locals = { params: { id: "t-404" } };
      (TrackService.getById as jest.Mock).mockRejectedValue(error);

      await TrackController.getTrackById(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it("getTrackStaff forwards errors to next", async () => {
      const req = {} as Request;
      const res = createMockRes();
      const error = new Error("permission denied");
      res.locals = { params: { id: "t-1" }, user: { id: "u-1" } };
      (TrackService.getStaff as jest.Mock).mockRejectedValue(error);

      await TrackController.getTrackStaff(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it("createTrack forwards errors to next", async () => {
      const req = {} as Request;
      const res = createMockRes();
      const error = new Error("duplicate name");
      res.locals = { user: { id: "u-1" }, body: { name: "Frontend" } };
      (TrackService.create as jest.Mock).mockRejectedValue(error);

      await TrackController.createTrack(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it("updateTrack forwards errors to next", async () => {
      const req = {} as Request;
      const res = createMockRes();
      const error = new Error("track not found");
      res.locals = { params: { id: "t-404" }, body: { name: "Updated" } };
      (TrackService.update as jest.Mock).mockRejectedValue(error);

      await TrackController.updateTrack(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it("deleteTrack forwards errors to next", async () => {
      const req = {} as Request;
      const res = createMockRes();
      const error = new Error("track not found");
      res.locals = { params: { id: "t-404" } };
      (TrackService.delete as jest.Mock).mockRejectedValue(error);

      await TrackController.deleteTrack(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it("forwards errors to next", async () => {
      const req = {} as Request;
      const res = createMockRes();
      const error = new Error("service failed");
      res.locals = { params: { id: "t-404" } };
      (TrackService.getById as jest.Mock).mockRejectedValue(error);

      await TrackController.getTrackById(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
