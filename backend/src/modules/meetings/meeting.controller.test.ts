import { Request, Response } from "express";
import MeetingController from "./meeting.controller";
import { MeetingService } from "./meeting.service";
import { HTTPStatusText } from "../../types/HTTPStatusText";
import { SuccessMessages } from "../../types/successMessages";

jest.mock("./meeting.service", () => ({
  MeetingService: {
    getUserMeetings: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    joinMeeting: jest.fn(),
    leaveMeeting: jest.fn(),
    addParticipant: jest.fn(),
    removeParticipant: jest.fn(),
    startMeeting: jest.fn(),
    checkHost: jest.fn(),
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

describe("MeetingController", () => {
  const next = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getOne returns meeting by id", async () => {
    const req = { params: { id: "m-1" } } as unknown as Request;
    const res = createMockRes();
    const meeting = { id: "m-1", title: "Meeting 1" };
    (MeetingService.getById as jest.Mock).mockResolvedValue(meeting);

    await MeetingController.getOne(req, res, next);

    expect(MeetingService.getById).toHaveBeenCalledWith("m-1");
    expect(res.json).toHaveBeenCalledWith({ status: HTTPStatusText.SUCCESS, data: meeting });
  });

  it("create returns created meeting payload", async () => {
    const req = { params: { courseId: "c-1" }, body: { title: "Daily" } } as unknown as Request;
    const res = createMockRes();
    const data = { meeting: { id: "m-1" } };
    res.locals = { user: { id: "u-1" } };
    (MeetingService.create as jest.Mock).mockResolvedValue(data);

    await MeetingController.create(req, res, next);

    expect(MeetingService.create).toHaveBeenCalledWith("u-1", "c-1", { title: "Daily" });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ status: HTTPStatusText.SUCCESS, data });
  });

  it("getAllUser returns user meetings", async () => {
    const req = {} as Request;
    const res = createMockRes();
    const data = [{ id: "m-1" }];
    res.locals = { user: { id: "u-1" } };
    (MeetingService.getUserMeetings as jest.Mock).mockResolvedValue(data);

    await MeetingController.getAllUser(req, res, next);

    expect(MeetingService.getUserMeetings).toHaveBeenCalledWith("u-1");
    expect(res.json).toHaveBeenCalledWith({ status: HTTPStatusText.SUCCESS, data });
  });

  it("update returns updated meeting payload", async () => {
    const req = { params: { id: "m-1" }, body: { title: "Updated" } } as unknown as Request;
    const res = createMockRes();
    const updatedMeeting = { id: "m-1", title: "Updated" };
    res.locals = { user: { id: "u-host" } };
    (MeetingService.update as jest.Mock).mockResolvedValue(updatedMeeting);

    await MeetingController.update(req, res, next);

    expect(MeetingService.update).toHaveBeenCalledWith("u-host", "m-1", { title: "Updated" });
    expect(res.json).toHaveBeenCalledWith({
      status: HTTPStatusText.SUCCESS,
      data: updatedMeeting,
    });
  });

  it("join returns join data", async () => {
    const req = { params: { meetingId: "m-1" } } as unknown as Request;
    const res = createMockRes();
    const data = { token: "abc" };
    res.locals = { user: { id: "u-join" } };
    (MeetingService.joinMeeting as jest.Mock).mockResolvedValue(data);

    await MeetingController.join(req, res, next);

    expect(MeetingService.joinMeeting).toHaveBeenCalledWith("u-join", "m-1");
    expect(res.json).toHaveBeenCalledWith({ status: HTTPStatusText.SUCCESS, data });
  });

  it("leave returns leave payload", async () => {
    const req = { params: { meetingId: "m-1" } } as unknown as Request;
    const res = createMockRes();
    const data = { left: true };
    res.locals = { user: { id: "u-join" } };
    (MeetingService.leaveMeeting as jest.Mock).mockResolvedValue(data);

    await MeetingController.leave(req, res, next);

    expect(MeetingService.leaveMeeting).toHaveBeenCalledWith("u-join", "m-1");
    expect(res.json).toHaveBeenCalledWith({ status: HTTPStatusText.SUCCESS, data });
  });

  it("delete returns deleted message", async () => {
    const req = { params: { id: "m-1" } } as unknown as Request;
    const res = createMockRes();
    res.locals = { user: { id: "u-host" } };

    await MeetingController.delete(req, res, next);

    expect(MeetingService.delete).toHaveBeenCalledWith("u-host", "m-1");
    expect(res.json).toHaveBeenCalledWith({
      status: HTTPStatusText.SUCCESS,
      message: SuccessMessages.DELETED_MEETING,
    });
  });

  it("startMeeting returns meeting object", async () => {
    const req = { params: { meetingId: "m-1" } } as unknown as Request;
    const res = createMockRes();
    const meeting = { id: "m-1", status: "LIVE" };
    res.locals = { user: { id: "u-host" } };
    (MeetingService.startMeeting as jest.Mock).mockResolvedValue(meeting);

    await MeetingController.startMeeting(req, res, next);

    expect(MeetingService.startMeeting).toHaveBeenCalledWith("u-host", "m-1");
    expect(res.json).toHaveBeenCalledWith({ status: HTTPStatusText.SUCCESS, meeting });
  });

  it("checkHost returns isHost true", async () => {
    const req = { params: { meetingId: "m-1" } } as unknown as Request;
    const res = createMockRes();
    res.locals = { user: { id: "u-host" } };

    await MeetingController.checkHost(req, res, next);

    expect(MeetingService.checkHost).toHaveBeenCalledWith("u-host", "m-1");
    expect(res.json).toHaveBeenCalledWith({ status: HTTPStatusText.SUCCESS, isHost: true });
  });

  it("forwards errors to next", async () => {
    const req = { params: { id: "m-1" } } as unknown as Request;
    const res = createMockRes();
    const error = new Error("service failed");
    (MeetingService.getById as jest.Mock).mockRejectedValue(error);

    await MeetingController.getOne(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("create error is forwarded to next", async () => {
    const req = { params: { courseId: "c-1" }, body: { title: "Daily" } } as unknown as Request;
    const res = createMockRes();
    res.locals = { user: { id: "u-1" } };
    const error = new Error("create failed");
    (MeetingService.create as jest.Mock).mockRejectedValue(error);

    await MeetingController.create(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("update error is forwarded to next", async () => {
    const req = { params: { id: "m-1" }, body: { title: "Updated" } } as unknown as Request;
    const res = createMockRes();
    res.locals = { user: { id: "u-host" } };
    const error = new Error("update failed");
    (MeetingService.update as jest.Mock).mockRejectedValue(error);

    await MeetingController.update(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("delete error is forwarded to next", async () => {
    const req = { params: { id: "m-1" } } as unknown as Request;
    const res = createMockRes();
    res.locals = { user: { id: "u-host" } };
    const error = new Error("delete failed");
    (MeetingService.delete as jest.Mock).mockRejectedValue(error);

    await MeetingController.delete(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("join error is forwarded to next", async () => {
    const req = { params: { meetingId: "m-1" } } as unknown as Request;
    const res = createMockRes();
    res.locals = { user: { id: "u-join" } };
    const error = new Error("join failed");
    (MeetingService.joinMeeting as jest.Mock).mockRejectedValue(error);

    await MeetingController.join(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("leave error is forwarded to next", async () => {
    const req = { params: { meetingId: "m-1" } } as unknown as Request;
    const res = createMockRes();
    res.locals = { user: { id: "u-join" } };
    const error = new Error("leave failed");
    (MeetingService.leaveMeeting as jest.Mock).mockRejectedValue(error);

    await MeetingController.leave(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("startMeeting error is forwarded to next", async () => {
    const req = { params: { meetingId: "m-1" } } as unknown as Request;
    const res = createMockRes();
    res.locals = { user: { id: "u-host" } };
    const error = new Error("start failed");
    (MeetingService.startMeeting as jest.Mock).mockRejectedValue(error);

    await MeetingController.startMeeting(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("checkHost error is forwarded to next", async () => {
    const req = { params: { meetingId: "m-1" } } as unknown as Request;
    const res = createMockRes();
    res.locals = { user: { id: "u-host" } };
    const error = new Error("check failed");
    (MeetingService.checkHost as jest.Mock).mockRejectedValue(error);

    await MeetingController.checkHost(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("getAllUser error is forwarded to next", async () => {
    const req = {} as Request;
    const res = createMockRes();
    res.locals = { user: { id: "u-1" } };
    const error = new Error("getAll failed");
    (MeetingService.getUserMeetings as jest.Mock).mockRejectedValue(error);

    await MeetingController.getAllUser(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
