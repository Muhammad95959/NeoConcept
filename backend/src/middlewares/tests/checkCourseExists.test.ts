import { Request, Response } from "express";
import prisma from "../../config/db";
import checkCourseExists from "../checkCourseExists";
import { ErrorMessages } from "../../types/errorsMessages";
import { HTTPStatusText } from "../../types/HTTPStatusText";

jest.mock("../../config/db", () => ({
  __esModule: true,
  default: {
    course: {
      findFirst: jest.fn(),
    },
  },
}));

describe("checkCourseExists", () => {
  const createRes = () =>
    ({
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

  it("calls next when course exists and is not deleted", async () => {
    const next = jest.fn();
    const res = createRes();
    const req = createReq({ courseId: "c-1" });

    (prisma.course.findFirst as jest.Mock).mockResolvedValue({ id: "c-1", name: "Math" });

    await checkCourseExists(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("returns 404 when course does not exist", async () => {
    const next = jest.fn();
    const res = createRes();
    const req = createReq({ courseId: "c-notfound" });

    (prisma.course.findFirst as jest.Mock).mockResolvedValue(null);

    await checkCourseExists(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      status: HTTPStatusText.FAIL,
      message: ErrorMessages.COURSE_NOT_FOUND,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 500 on database error", async () => {
    const next = jest.fn();
    const res = createRes();
    const req = createReq({ courseId: "c-1" });
    const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => undefined);

    (prisma.course.findFirst as jest.Mock).mockRejectedValue(new Error("db error"));

    await checkCourseExists(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      status: HTTPStatusText.ERROR,
      message: ErrorMessages.SOMETHING_WENT_WRONG,
    });
    expect(next).not.toHaveBeenCalled();

    consoleLogSpy.mockRestore();
  });
});
