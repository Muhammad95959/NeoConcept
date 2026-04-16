import { Request, Response } from "express";
import { HTTPStatusText } from "../../../types/HTTPStatusText";
import { SuccessMessages } from "../../../types/successMessages";
import { CommentController } from "../comment.controller";
import { CommentService } from "../comment.service";

jest.mock("../comment.service", () => ({
  CommentService: {
    getMany: jest.fn(),
    get: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
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

describe("CommentController", () => {
  const next = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getMany", () => {
    it("returns comments for post", async () => {
      const req = {} as Request;
      const res = createMockRes();
      const data = [{ id: "c-1" }];
      res.locals = { params: { postId: "p-1" } };
      (CommentService.getMany as jest.Mock).mockResolvedValue(data);

      await CommentController.getMany(req, res, next);

      expect(CommentService.getMany).toHaveBeenCalledWith({ postId: "p-1" });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ status: HTTPStatusText.SUCCESS, data });
    });
  });

  describe("get", () => {
    it("returns single comment", async () => {
      const req = {} as Request;
      const res = createMockRes();
      const data = { id: "c-1", content: "Hello" };
      res.locals = { params: { postId: "p-1", id: "c-1" } };
      (CommentService.get as jest.Mock).mockResolvedValue(data);

      await CommentController.get(req, res, next);

      expect(CommentService.get).toHaveBeenCalledWith({ postId: "p-1", id: "c-1" });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ status: HTTPStatusText.SUCCESS, data });
    });
  });

  describe("create", () => {
    it("returns created comment", async () => {
      const req = {} as Request;
      const res = createMockRes();
      const data = { id: "c-1" };
      res.locals = {
        params: { postId: "p-1" },
        body: { content: "Hello" },
        user: { id: "u-1" },
      };
      (CommentService.create as jest.Mock).mockResolvedValue(data);

      await CommentController.create(req, res, next);

      expect(CommentService.create).toHaveBeenCalledWith({
        postId: "p-1",
        userId: "u-1",
        content: "Hello",
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ status: HTTPStatusText.SUCCESS, data });
    });
  });

  describe("update", () => {
    it("returns updated comment", async () => {
      const req = {} as Request;
      const res = createMockRes();
      const data = { id: "c-1", content: "Updated" };
      res.locals = {
        params: { postId: "p-1", id: "c-1" },
        body: { content: "Updated" },
        user: { id: "u-1" },
      };
      (CommentService.update as jest.Mock).mockResolvedValue(data);

      await CommentController.update(req, res, next);

      expect(CommentService.update).toHaveBeenCalledWith({
        postId: "p-1",
        id: "c-1",
        userId: "u-1",
        content: "Updated",
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ status: HTTPStatusText.SUCCESS, data });
    });
  });

  describe("delete", () => {
    it("returns success message", async () => {
      const req = {} as Request;
      const res = createMockRes();
      res.locals = { params: { postId: "p-1", id: "c-1" } };

      await CommentController.delete(req, res, next);

      expect(CommentService.delete).toHaveBeenCalledWith({ postId: "p-1", id: "c-1" });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: HTTPStatusText.SUCCESS,
        message: SuccessMessages.COMMENT_DELETED,
      });
    });
  });

  it("forwards service errors to next", async () => {
    const req = {} as Request;
    const res = createMockRes();
    const error = new Error("get failed");
    res.locals = { params: { postId: "p-1", id: "c-1" } };
    (CommentService.get as jest.Mock).mockRejectedValue(error);

    await CommentController.get(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
