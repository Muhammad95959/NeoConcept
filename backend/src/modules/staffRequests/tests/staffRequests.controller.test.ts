import { Request, Response } from "express";
import { Status } from "../../../generated/prisma";
import { HTTPStatusText } from "../../../types/HTTPStatusText";
import { SuccessMessages } from "../../../types/successMessages";
import { StaffRequestController } from "../staffRequests.controller";
import { StaffRequestService } from "../staffRequests.service";

jest.mock("./staffRequests.service", () => ({
  StaffRequestService: {
    getMany: jest.fn(),
    get: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
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

describe("StaffRequestController", () => {
  const next = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getMany returns staff requests", async () => {
    const req = {} as Request;
    const res = createMockRes();
    const data = [{ id: "sr-1" }];
    res.locals = { user: { id: "u-1" } };
    (StaffRequestService.getMany as jest.Mock).mockResolvedValue(data);

    await StaffRequestController.getMany(req, res, next);

    expect(StaffRequestService.getMany).toHaveBeenCalledWith("u-1");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: HTTPStatusText.SUCCESS, data });
  });

  it("get returns specific staff request", async () => {
    const req = {} as Request;
    const res = createMockRes();
    const data = { id: "sr-1", userId: "u-2", courseId: "c-1" };
    res.locals = { params: { id: "sr-1" } };
    (StaffRequestService.get as jest.Mock).mockResolvedValue(data);

    await StaffRequestController.get(req, res, next);

    expect(StaffRequestService.get).toHaveBeenCalledWith("sr-1");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: HTTPStatusText.SUCCESS, data });
  });

  it("create returns created staff request", async () => {
    const req = {} as Request;
    const res = createMockRes();
    const data = { id: "sr-1" };
    res.locals = { user: { id: "u-1" }, body: { courseId: "c-1", message: "hi" } };
    (StaffRequestService.create as jest.Mock).mockResolvedValue(data);

    await StaffRequestController.create(req, res, next);

    expect(StaffRequestService.create).toHaveBeenCalledWith("u-1", "c-1", "hi");
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ status: HTTPStatusText.SUCCESS, data });
  });

  it("update returns updated request", async () => {
    const req = {} as Request;
    const res = createMockRes();
    const data = { id: "sr-1", message: "updated" };
    res.locals = { params: { id: "sr-1" }, user: { id: "u-1" }, body: { message: "updated" } };
    (StaffRequestService.update as jest.Mock).mockResolvedValue(data);

    await StaffRequestController.update(req, res, next);

    expect(StaffRequestService.update).toHaveBeenCalledWith("sr-1", "u-1", "updated");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: HTTPStatusText.SUCCESS, data });
  });

  it("answer returns success message", async () => {
    const req = {} as Request;
    const res = createMockRes();
    res.locals = { params: { id: "sr-1" }, body: { status: Status.APPROVED } };
    (StaffRequestService.answer as jest.Mock).mockResolvedValue("Request approved successfully");

    await StaffRequestController.answer(req, res, next);

    expect(StaffRequestService.answer).toHaveBeenCalledWith("sr-1", Status.APPROVED);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: HTTPStatusText.SUCCESS,
      message: "Request approved successfully",
    });
  });

  it("delete returns request deleted message", async () => {
    const req = {} as Request;
    const res = createMockRes();
    res.locals = { params: { id: "sr-1" }, user: { id: "u-1" } };

    await StaffRequestController.delete(req, res, next);

    expect(StaffRequestService.delete).toHaveBeenCalledWith("sr-1", "u-1");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: HTTPStatusText.SUCCESS,
      message: SuccessMessages.REQUEST_DELETED,
    });
  });

  it("getMany forwards errors to next", async () => {
    const req = {} as Request;
    const res = createMockRes();
    const error = new Error("service failed");
    res.locals = { user: { id: "u-1" } };
    (StaffRequestService.getMany as jest.Mock).mockRejectedValue(error);

    await StaffRequestController.getMany(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("get forwards errors to next", async () => {
    const req = {} as Request;
    const res = createMockRes();
    const error = new Error("not found");
    res.locals = { params: { id: "sr-404" } };
    (StaffRequestService.get as jest.Mock).mockRejectedValue(error);

    await StaffRequestController.get(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("create forwards errors to next", async () => {
    const req = {} as Request;
    const res = createMockRes();
    const error = new Error("create failed");
    res.locals = { user: { id: "u-1" }, body: { courseId: "c-1", message: "test" } };
    (StaffRequestService.create as jest.Mock).mockRejectedValue(error);

    await StaffRequestController.create(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("update forwards errors to next", async () => {
    const req = {} as Request;
    const res = createMockRes();
    const error = new Error("update failed");
    res.locals = { params: { id: "sr-1" }, user: { id: "u-1" }, body: { message: "test" } };
    (StaffRequestService.update as jest.Mock).mockRejectedValue(error);

    await StaffRequestController.update(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("answer forwards errors to next", async () => {
    const req = {} as Request;
    const res = createMockRes();
    const error = new Error("answer failed");
    res.locals = { params: { id: "sr-1" }, body: { status: Status.APPROVED } };
    (StaffRequestService.answer as jest.Mock).mockRejectedValue(error);

    await StaffRequestController.answer(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("delete forwards errors to next", async () => {
    const req = {} as Request;
    const res = createMockRes();
    const error = new Error("delete failed");
    res.locals = { params: { id: "sr-1" }, user: { id: "u-1" } };
    (StaffRequestService.delete as jest.Mock).mockRejectedValue(error);

    await StaffRequestController.delete(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
