import { Request, Response } from "express";
import { HTTPStatusText } from "../../../types/HTTPStatusText";
import { SuccessMessages } from "../../../types/successMessages";
import { CourseController } from "../course.controller";
import { CourseService } from "../course.service";

jest.mock("../course.service", () => ({
  CourseService: {
    getMany: jest.fn(),
    get: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateStaff: jest.fn(),
    delete: jest.fn(),
  },
}));

const createMockRes = () => {
  const res: Partial<Response> = {
    locals: {},
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };

  return res as Response;
};

describe("CourseController", () => {
  const next = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getMany returns course list", async () => {
    const req = {} as Request;
    const res = createMockRes();
    res.locals = { query: { search: "react" } };
    const data = [{ id: "c-1" }];

    (CourseService.getMany as jest.Mock).mockResolvedValue(data);

    await CourseController.getMany(req, res, next);

    expect(CourseService.getMany).toHaveBeenCalledWith({ search: "react" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: HTTPStatusText.SUCCESS, data });
  });

  it("get returns single course", async () => {
    const req = {} as Request;
    const res = createMockRes();
    res.locals = { params: { id: "c-1" } };
    const data = { id: "c-1", name: "React" };

    (CourseService.get as jest.Mock).mockResolvedValue(data);

    await CourseController.get(req, res, next);

    expect(CourseService.get).toHaveBeenCalledWith("c-1");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: HTTPStatusText.SUCCESS, data });
  });

  it("create returns created course", async () => {
    const req = {} as Request;
    const res = createMockRes();
    res.locals = { body: { name: "New Course", trackId: "t-1" } };
    const data = { id: "c-2", name: "New Course" };

    (CourseService.create as jest.Mock).mockResolvedValue(data);

    await CourseController.create(req, res, next);

    expect(CourseService.create).toHaveBeenCalledWith({ name: "New Course", trackId: "t-1" });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ status: HTTPStatusText.SUCCESS, data });
  });

  it("updateStaff returns success message", async () => {
    const req = {} as Request;
    const res = createMockRes();
    res.locals = {
      params: { id: "c-1" },
      body: { trackId: "t-1", instructorIds: ["i-1"], assistantIds: ["a-1"] },
    };

    (CourseService.updateStaff as jest.Mock).mockResolvedValue({ message: SuccessMessages.COURSE_STAFF_UPDATED });

    await CourseController.updateStaff(req, res, next);

    expect(CourseService.updateStaff).toHaveBeenCalledWith("c-1", {
      trackId: "t-1",
      instructorIds: ["i-1"],
      assistantIds: ["a-1"],
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: HTTPStatusText.SUCCESS,
      message: SuccessMessages.COURSE_STAFF_UPDATED,
    });
  });

  it("delete returns deleted message", async () => {
    const req = {} as Request;
    const res = createMockRes();
    res.locals = { params: { id: "c-1" } };

    await CourseController.delete(req, res, next);

    expect(CourseService.delete).toHaveBeenCalledWith("c-1");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: HTTPStatusText.SUCCESS,
      message: SuccessMessages.COURSE_DELETED,
    });
  });

  it("forwards service errors to next", async () => {
    const req = {} as Request;
    const res = createMockRes();
    const error = new Error("create failed");
    res.locals = { body: { name: "Broken", trackId: "t-1" } };
    (CourseService.create as jest.Mock).mockRejectedValue(error);

    await CourseController.create(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
