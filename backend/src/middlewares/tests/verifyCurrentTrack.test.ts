import { Request, Response, NextFunction } from "express";
import { Role } from "../../generated/prisma";
import prisma from "../../config/db";
import verifyCurrentTrack from "../verifyCurrentTrack";
import { ErrorMessages } from "../../types/errorsMessages";
import { HTTPStatusText } from "../../types/HTTPStatusText";

jest.mock("../../config/db", () => ({
  __esModule: true,
  default: {
    userTrack: {
      count: jest.fn(),
    },
  },
}));

describe("verifyCurrentTrack", () => {
  const createRes = (user?: any) =>
    ({
      locals: { user },
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }) as unknown as Response;

  const createReq = () => ({}) as unknown as Request;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("calls next when student has no active track", async () => {
    const next = jest.fn() as NextFunction;
    const res = createRes({ id: "u-1", role: Role.STUDENT });
    const req = createReq();

    (prisma.userTrack.count as jest.Mock).mockResolvedValue(0);

    await verifyCurrentTrack(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("calls next when student has active track", async () => {
    const next = jest.fn() as NextFunction;
    const res = createRes({ id: "u-2", role: Role.STUDENT });
    const req = createReq();

    (prisma.userTrack.count as jest.Mock).mockResolvedValue(1);

    await verifyCurrentTrack(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("returns 400 when non-student has active track", async () => {
    const next = jest.fn() as NextFunction;
    const res = createRes({ id: "u-3", role: Role.INSTRUCTOR });
    const req = createReq();

    (prisma.userTrack.count as jest.Mock).mockResolvedValue(1);

    await verifyCurrentTrack(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: HTTPStatusText.FAIL,
      message: ErrorMessages.YOU_ARE_ALREADY_ENROLLED_IN_A_TRACK,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next when non-student has no active track", async () => {
    const next = jest.fn() as NextFunction;
    const res = createRes({ id: "u-4", role: Role.ASSISTANT });
    const req = createReq();

    (prisma.userTrack.count as jest.Mock).mockResolvedValue(0);

    await verifyCurrentTrack(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("calls next on error", async () => {
    const next = jest.fn() as NextFunction;
    const res = createRes({ id: "u-5", role: Role.STUDENT });
    const req = createReq();

    (prisma.userTrack.count as jest.Mock).mockRejectedValue(new Error("db error"));

    await verifyCurrentTrack(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
