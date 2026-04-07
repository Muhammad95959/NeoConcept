import { Request, Response } from "express";
import { HTTPStatusText } from "../../types/HTTPStatusText";
import { SuccessMessages } from "../../types/successMessages";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";

jest.mock("./user.service", () => ({
  UserService: {
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
    getUserTracks: jest.fn(),
    selectTrack: jest.fn(),
    quitTrack: jest.fn(),
    getUserCourses: jest.fn(),
    joinCourse: jest.fn(),
    quitCourse: jest.fn(),
    getUserStaffRequests: jest.fn(),
    getUserStudentRequests: jest.fn(),
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

describe("UserController", () => {
  const next = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("updateUser returns success message", async () => {
    const req = { body: { username: "Neo", password: "pass" } } as Request;
    const res = createMockRes();
    res.locals = { user: { id: "u-1", deletedAt: null } };

    (UserService.updateUser as jest.Mock).mockResolvedValue({ message: SuccessMessages.USER_UPDATED });

    await UserController.updateUser(req, res, next);

    expect(UserService.updateUser).toHaveBeenCalledWith({
      userId: "u-1",
      username: "Neo",
      password: "pass",
      deletedAt: null,
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: HTTPStatusText.SUCCESS,
      message: SuccessMessages.USER_UPDATED,
    });
  });

  it("deleteUser returns success message", async () => {
    const req = {} as Request;
    const res = createMockRes();
    res.locals = { user: { id: "u-2" } };

    await UserController.deleteUser(req, res, next);

    expect(UserService.deleteUser).toHaveBeenCalledWith({ id: "u-2" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: HTTPStatusText.SUCCESS,
      message: SuccessMessages.USER_DELETED,
    });
  });

  it("getUserTracks returns tracks", async () => {
    const req = {} as Request;
    const res = createMockRes();
    const tracks = [{ id: "t-1" }];
    res.locals = { user: { id: "u-3" } };

    (UserService.getUserTracks as jest.Mock).mockResolvedValue(tracks);

    await UserController.getUserTracks(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: HTTPStatusText.SUCCESS, data: tracks });
  });

  it("selectTrack returns success message", async () => {
    const req = { body: { trackId: "t-1" } } as Request;
    const res = createMockRes();
    res.locals = { user: { id: "u-4" } };

    await UserController.selectTrack(req, res, next);

    expect(UserService.selectTrack).toHaveBeenCalledWith({ user: { id: "u-4" }, trackId: "t-1" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: HTTPStatusText.SUCCESS,
      message: SuccessMessages.TRACK_SELECTED,
    });
  });

  it("joinCourse returns success message", async () => {
    const req = { body: { courseId: "c-1" } } as Request;
    const res = createMockRes();
    res.locals = { user: { id: "u-5" } };

    await UserController.joinCourse(req, res, next);

    expect(UserService.joinCourse).toHaveBeenCalledWith({ user: { id: "u-5" }, courseId: "c-1" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: HTTPStatusText.SUCCESS,
      message: SuccessMessages.COURSE_JOINED,
    });
  });

  it("quitCourse returns success message", async () => {
    const req = { body: { courseId: "c-2" } } as Request;
    const res = createMockRes();
    res.locals = { user: { id: "u-6" } };

    await UserController.quitCourse(req, res, next);

    expect(UserService.quitCourse).toHaveBeenCalledWith({ user: { id: "u-6" }, courseId: "c-2" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: HTTPStatusText.SUCCESS,
      message: SuccessMessages.COURSE_QUITTED,
    });
  });

  it("getUserStaffRequests passes query filters", async () => {
    const req = { query: { status: "PENDING", search: "react" } } as unknown as Request;
    const res = createMockRes();
    const requests = [{ id: "sr-1" }];
    res.locals = { user: { id: "u-7" } };

    (UserService.getUserStaffRequests as jest.Mock).mockResolvedValue(requests);

    await UserController.getUserStaffRequests(req, res, next);

    expect(UserService.getUserStaffRequests).toHaveBeenCalledWith({
      user: { id: "u-7" },
      status: "PENDING",
      search: "react",
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: HTTPStatusText.SUCCESS, data: requests });
  });

  it("forwards service errors to next", async () => {
    const req = { body: { trackId: "t-9" } } as Request;
    const res = createMockRes();
    const error = new Error("select failed");
    res.locals = { user: { id: "u-8" } };
    (UserService.selectTrack as jest.Mock).mockRejectedValue(error);

    await UserController.selectTrack(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});