import { Request, Response } from "express";
import { Status } from "../../generated/prisma";
import { HTTPStatusText } from "../../types/HTTPStatusText";
import { SuccessMessages } from "../../types/successMessages";
import { StudentRequestController } from "./studentRequests.controller";
import { StudentRequestService } from "./studentRequests.service";

jest.mock("./studentRequests.service", () => ({
  StudentRequestService: {
    getMany: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    answer: jest.fn(),
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

describe("StudentRequestController", () => {
  const next = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getCourseStudentRequests uppercases status filter", async () => {
    const req = {} as Request;
    const res = createMockRes();
    const data = [{ id: "st-1" }];
    res.locals = { user: { id: "u-1" }, query: { courseId: "c-1", status: "pending" } };
    (StudentRequestService.getMany as jest.Mock).mockResolvedValue(data);

    await StudentRequestController.getCourseStudentRequests(req, res, next);

    expect(StudentRequestService.getMany).toHaveBeenCalledWith("u-1", "c-1", Status.PENDING);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: HTTPStatusText.SUCCESS, data });
  });

  it("getCourseStudentRequests passes undefined status when missing", async () => {
    const req = {} as Request;
    const res = createMockRes();
    const data = [{ id: "st-1" }];
    res.locals = { user: { id: "u-1" }, query: { courseId: "c-1" } };
    (StudentRequestService.getMany as jest.Mock).mockResolvedValue(data);

    await StudentRequestController.getCourseStudentRequests(req, res, next);

    expect(StudentRequestService.getMany).toHaveBeenCalledWith("u-1", "c-1", undefined);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: HTTPStatusText.SUCCESS, data });
  });

  it("getCourseStudentRequestById returns specific request", async () => {
    const req = {} as Request;
    const res = createMockRes();
    const data = { id: "st-1", courseId: "c-1", userId: "u-2" };
    res.locals = { user: { id: "u-1" }, params: { id: "st-1" } };
    (StudentRequestService.getById as jest.Mock).mockResolvedValue(data);

    await StudentRequestController.getCourseStudentRequestById(req, res, next);

    expect(StudentRequestService.getById).toHaveBeenCalledWith("u-1", "st-1");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: HTTPStatusText.SUCCESS, data });
  });

  it("createStudentRequest returns created request", async () => {
    const req = {} as Request;
    const res = createMockRes();
    const data = { id: "st-1", courseId: "c-1", userId: "u-2" };
    res.locals = { user: { id: "u-2" }, body: { courseId: "c-1" } };
    (StudentRequestService.create as jest.Mock).mockResolvedValue(data);

    await StudentRequestController.createStudentRequest(req, res, next);

    expect(StudentRequestService.create).toHaveBeenCalledWith("u-2", "c-1");
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ status: HTTPStatusText.SUCCESS, data });
  });

  it("answerStudentRequest returns service message", async () => {
    const req = {} as Request;
    const res = createMockRes();
    res.locals = { user: { id: "u-staff" }, params: { id: "st-1" }, body: { status: Status.APPROVED } };
    (StudentRequestService.answer as jest.Mock).mockResolvedValue("Request approved successfully");

    await StudentRequestController.answerStudentRequest(req, res, next);

    expect(StudentRequestService.answer).toHaveBeenCalledWith("u-staff", "st-1", Status.APPROVED);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: HTTPStatusText.SUCCESS,
      message: "Request approved successfully",
    });
  });

  it("deleteStudentRequest returns deleted message", async () => {
    const req = {} as Request;
    const res = createMockRes();
    res.locals = { user: { id: "u-1" }, params: { id: "st-1" } };

    await StudentRequestController.deleteStudentRequest(req, res, next);

    expect(StudentRequestService.delete).toHaveBeenCalledWith("u-1", "st-1");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: HTTPStatusText.SUCCESS,
      message: SuccessMessages.REQUEST_DELETED,
    });
  });

  it("getCourseStudentRequests forwards errors to next", async () => {
    const req = {} as Request;
    const res = createMockRes();
    const error = new Error("not staff");
    res.locals = { user: { id: "u-1" }, query: { courseId: "c-1" } };
    (StudentRequestService.getMany as jest.Mock).mockRejectedValue(error);

    await StudentRequestController.getCourseStudentRequests(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("getCourseStudentRequestById forwards errors to next", async () => {
    const req = {} as Request;
    const res = createMockRes();
    const error = new Error("not found");
    res.locals = { user: { id: "u-1" }, params: { id: "st-404" } };
    (StudentRequestService.getById as jest.Mock).mockRejectedValue(error);

    await StudentRequestController.getCourseStudentRequestById(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("createStudentRequest forwards errors to next", async () => {
    const req = {} as Request;
    const res = createMockRes();
    const error = new Error("service failed");
    res.locals = { user: { id: "u-1" }, body: { courseId: "c-1" } };
    (StudentRequestService.create as jest.Mock).mockRejectedValue(error);

    await StudentRequestController.createStudentRequest(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("answerStudentRequest forwards errors to next", async () => {
    const req = {} as Request;
    const res = createMockRes();
    const error = new Error("not staff");
    res.locals = { user: { id: "u-1" }, params: { id: "st-1" }, body: { status: Status.APPROVED } };
    (StudentRequestService.answer as jest.Mock).mockRejectedValue(error);

    await StudentRequestController.answerStudentRequest(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("deleteStudentRequest forwards errors to next", async () => {
    const req = {} as Request;
    const res = createMockRes();
    const error = new Error("delete failed");
    res.locals = { user: { id: "u-1" }, params: { id: "st-1" } };
    (StudentRequestService.delete as jest.Mock).mockRejectedValue(error);

    await StudentRequestController.deleteStudentRequest(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
