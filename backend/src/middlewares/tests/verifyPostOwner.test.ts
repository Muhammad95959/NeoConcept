import { Request, Response, NextFunction } from "express";
import prisma from "../../config/db";
import verifyPostOwner from "../verifyPostOwner";
import { ErrorMessages } from "../../types/errorsMessages";
import { HTTPStatusText } from "../../types/HTTPStatusText";

jest.mock("../../config/db", () => ({
  __esModule: true,
  default: {
    post: {
      findUnique: jest.fn(),
    },
  },
}));

describe("verifyPostOwner", () => {
  const createRes = (userId?: string) =>
    ({
      locals: { user: { id: userId || "u-1" } },
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }) as unknown as Response;

  const createReq = (params: any) =>
    ({
      params,
    }) as unknown as Request;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("calls next when user is post owner", async () => {
    const next = jest.fn() as NextFunction;
    const res = createRes("u-1");
    const req = createReq({ courseId: "c-1", id: "p-1" });
    const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => undefined);

    (prisma.post.findUnique as jest.Mock).mockResolvedValue({
      id: "p-1",
      courseId: "c-1",
      uploadedBy: "u-1",
    });

    await verifyPostOwner(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();

    consoleLogSpy.mockRestore();
  });

  it("returns 404 when post does not exist", async () => {
    const next = jest.fn() as NextFunction;
    const res = createRes("u-1");
    const req = createReq({ courseId: "c-1", id: "p-notfound" });
    const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => undefined);

    (prisma.post.findUnique as jest.Mock).mockResolvedValue(null);

    await verifyPostOwner(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      status: HTTPStatusText.FAIL,
      message: ErrorMessages.POST_NOT_FOUND,
    });
    expect(next).not.toHaveBeenCalled();

    consoleLogSpy.mockRestore();
  });

  it("returns 404 when post belongs to different course", async () => {
    const next = jest.fn() as NextFunction;
    const res = createRes("u-1");
    const req = createReq({ courseId: "c-1", id: "p-1" });
    const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => undefined);

    (prisma.post.findUnique as jest.Mock).mockResolvedValue({
      id: "p-1",
      courseId: "c-2", // different course
      uploadedBy: "u-1",
    });

    await verifyPostOwner(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      status: HTTPStatusText.FAIL,
      message: ErrorMessages.POST_NOT_FOUND,
    });
    expect(next).not.toHaveBeenCalled();

    consoleLogSpy.mockRestore();
  });

  it("returns 403 when user is not post owner", async () => {
    const next = jest.fn() as NextFunction;
    const res = createRes("u-2");
    const req = createReq({ courseId: "c-1", id: "p-1" });
    const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => undefined);

    (prisma.post.findUnique as jest.Mock).mockResolvedValue({
      id: "p-1",
      courseId: "c-1",
      uploadedBy: "u-1", // different owner
    });

    await verifyPostOwner(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      status: HTTPStatusText.FAIL,
      message: ErrorMessages.NOT_POST_OWNER,
    });
    expect(next).not.toHaveBeenCalled();

    consoleLogSpy.mockRestore();
  });

  it("returns 500 on database error", async () => {
    const next = jest.fn() as NextFunction;
    const res = createRes("u-1");
    const req = createReq({ courseId: "c-1", id: "p-1" });
    const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => undefined);

    (prisma.post.findUnique as jest.Mock).mockRejectedValue(new Error("db error"));

    await verifyPostOwner(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      status: HTTPStatusText.FAIL,
      message: ErrorMessages.SOMETHING_WENT_WRONG,
    });
    expect(next).not.toHaveBeenCalled();

    consoleLogSpy.mockRestore();
  });
});
