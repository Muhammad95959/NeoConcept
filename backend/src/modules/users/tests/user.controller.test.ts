import { Request, Response } from "express";
import { HTTPStatusText } from "../../../types/HTTPStatusText";
import { SuccessMessages } from "../../../types/successMessages";
import { UserController } from "../user.controller";
import { UserService } from "../user.service";

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

  it("getUserStudentRequests passes query filters", async () => {
    const req = { query: { status: "APPROVED", search: "english" } } as unknown as Request;
    const res = createMockRes();
    const requests = [{ id: "str-1" }];
    res.locals = { user: { id: "u-8" } };

    (UserService.getUserStudentRequests as jest.Mock).mockResolvedValue(requests);

    await UserController.getUserStudentRequests(req, res, next);

    expect(UserService.getUserStudentRequests).toHaveBeenCalledWith({ id: "u-8" }, "APPROVED", "english");
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

  describe("error handling", () => {
    it("updateUser forwards errors to next", async () => {
      const req = { body: { username: "Test" } } as Request;
      const res = createMockRes();
      const error = new Error("update failed");
      res.locals = { user: { id: "u-1" } };
      (UserService.updateUser as jest.Mock).mockRejectedValue(error);

      await UserController.updateUser(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it("deleteUser forwards errors to next", async () => {
      const req = {} as Request;
      const res = createMockRes();
      const error = new Error("delete failed");
      res.locals = { user: { id: "u-2" } };
      (UserService.deleteUser as jest.Mock).mockRejectedValue(error);

      await UserController.deleteUser(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it("getUserTracks forwards errors to next", async () => {
      const req = {} as Request;
      const res = createMockRes();
      const error = new Error("get tracks failed");
      res.locals = { user: { id: "u-3" } };
      (UserService.getUserTracks as jest.Mock).mockRejectedValue(error);

      await UserController.getUserTracks(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it("quitTrack forwards errors to next", async () => {
      const req = { body: { trackId: "t-1" } } as Request;
      const res = createMockRes();
      const error = new Error("quit track failed");
      res.locals = { user: { id: "u-4" } };
      (UserService.quitTrack as jest.Mock).mockRejectedValue(error);

      await UserController.quitTrack(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it("getUserCourses forwards errors to next", async () => {
      const req = {} as Request;
      const res = createMockRes();
      const error = new Error("get courses failed");
      res.locals = { user: { id: "u-5" } };
      (UserService.getUserCourses as jest.Mock).mockRejectedValue(error);

      await UserController.getUserCourses(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it("joinCourse forwards errors to next", async () => {
      const req = { body: { courseId: "c-1" } } as Request;
      const res = createMockRes();
      const error = new Error("join failed");
      res.locals = { user: { id: "u-9" } };
      (UserService.joinCourse as jest.Mock).mockRejectedValue(error);

      await UserController.joinCourse(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it("quitCourse forwards errors to next", async () => {
      const req = { body: { courseId: "c-2" } } as Request;
      const res = createMockRes();
      const error = new Error("quit course failed");
      res.locals = { user: { id: "u-10" } };
      (UserService.quitCourse as jest.Mock).mockRejectedValue(error);

      await UserController.quitCourse(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it("getUserStaffRequests forwards errors to next", async () => {
      const req = { query: { status: "PENDING" } } as unknown as Request;
      const res = createMockRes();
      const error = new Error("get staff requests failed");
      res.locals = { user: { id: "u-11" } };
      (UserService.getUserStaffRequests as jest.Mock).mockRejectedValue(error);

      await UserController.getUserStaffRequests(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it("getUserStudentRequests forwards errors to next", async () => {
      const req = { query: { status: "PENDING" } } as unknown as Request;
      const res = createMockRes();
      const error = new Error("get student requests failed");
      res.locals = { user: { id: "u-12" } };
      (UserService.getUserStudentRequests as jest.Mock).mockRejectedValue(error);

      await UserController.getUserStudentRequests(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
