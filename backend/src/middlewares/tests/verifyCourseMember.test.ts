import { Request, Response } from "express";
import prisma from "../../config/db";
import verifyCourseMember from "../verifyCourseMember";
import { ErrorMessages } from "../../types/errorsMessages";
import { HTTPStatusText } from "../../types/HTTPStatusText";

jest.mock("../../config/db", () => ({
  __esModule: true,
  default: {
    userCourse: {
      findUnique: jest.fn(),
    },
  },
}));

describe("verifyCourseMember", () => {
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

  it("calls next when user is course member", async () => {
    const next = jest.fn();
    const res = createRes("u-1");
    const req = createReq({ courseId: "c-1" });

    (prisma.userCourse.findUnique as jest.Mock).mockResolvedValue({
      userId: "u-1",
      courseId: "c-1",
    });

    await verifyCourseMember(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("returns 403 when user is not a course member", async () => {
    const next = jest.fn();
    const res = createRes("u-2");
    const req = createReq({ courseId: "c-1" });

    (prisma.userCourse.findUnique as jest.Mock).mockResolvedValue(null);

    await verifyCourseMember(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      status: HTTPStatusText.FAIL,
      message: ErrorMessages.NOT_A_MEMBER_OF_COURSE,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 500 on database error", async () => {
    const next = jest.fn();
    const res = createRes("u-3");
    const req = createReq({ courseId: "c-1" });
    const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => undefined);

    (prisma.userCourse.findUnique as jest.Mock).mockRejectedValue(new Error("db error"));

    await verifyCourseMember(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      status: HTTPStatusText.FAIL,
      message: ErrorMessages.SOMETHING_WENT_WRONG,
    });
    expect(next).not.toHaveBeenCalled();

    consoleLogSpy.mockRestore();
  });
});
