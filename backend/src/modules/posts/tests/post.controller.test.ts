import { Request, Response } from "express";
import { HTTPStatusText } from "../../../types/HTTPStatusText";
import { SuccessMessages } from "../../../types/successMessages";
import { PostsController } from "../post.controller";
import { PostService } from "../post.service";

jest.mock("../post.service", () => ({
  PostService: {
    getPosts: jest.fn(),
    getPost: jest.fn(),
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

describe("PostsController", () => {
  const next = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getPosts returns posts for course", async () => {
    const req = {} as Request;
    const res = createMockRes();
    const data = [{ id: "p-1" }];
    res.locals = { params: { courseId: "c-1" }, query: { search: "intro" } };
    (PostService.getPosts as jest.Mock).mockResolvedValue(data);

    await PostsController.getPosts(req, res, next);

    expect(PostService.getPosts).toHaveBeenCalledWith({ courseId: "c-1", search: "intro" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: HTTPStatusText.SUCCESS, data });
  });

  it("getPost returns single post", async () => {
    const req = {} as Request;
    const res = createMockRes();
    const data = { id: "p-1", title: "Hello" };
    res.locals = { params: { courseId: "c-1", id: "p-1" } };
    (PostService.getPost as jest.Mock).mockResolvedValue(data);

    await PostsController.getPost(req, res, next);

    expect(PostService.getPost).toHaveBeenCalledWith({ courseId: "c-1", id: "p-1" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: HTTPStatusText.SUCCESS, data });
  });

  it("create returns created post", async () => {
    const req = {} as Request;
    const res = createMockRes();
    const data = { id: "p-2" };
    res.locals = {
      params: { courseId: "c-1" },
      body: { title: "Title", content: "Content" },
      user: { id: "u-1" },
    };
    (PostService.create as jest.Mock).mockResolvedValue(data);

    await PostsController.create(req, res, next);

    expect(PostService.create).toHaveBeenCalledWith({
      courseId: "c-1",
      userId: "u-1",
      title: "Title",
      content: "Content",
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ status: HTTPStatusText.SUCCESS, data });
  });

  it("update returns updated post", async () => {
    const req = {} as Request;
    const res = createMockRes();
    const data = { id: "p-1", title: "Updated" };
    res.locals = {
      params: { courseId: "c-1", id: "p-1" },
      body: { title: "Updated", content: "" },
      user: { id: "u-1" },
    };
    (PostService.update as jest.Mock).mockResolvedValue(data);

    await PostsController.update(req, res, next);

    expect(PostService.update).toHaveBeenCalledWith({
      courseId: "c-1",
      id: "p-1",
      userId: "u-1",
      title: "Updated",
      content: "",
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: HTTPStatusText.SUCCESS, data });
  });

  it("delete returns success message", async () => {
    const req = {} as Request;
    const res = createMockRes();
    res.locals = { params: { courseId: "c-1", id: "p-1" }, user: { id: "u-1" } };

    await PostsController.delete(req, res, next);

    expect(PostService.delete).toHaveBeenCalledWith({ courseId: "c-1", id: "p-1", userId: "u-1" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: HTTPStatusText.SUCCESS,
      message: SuccessMessages.POST_DELETED,
    });
  });

  it("forwards service errors to next", async () => {
    const req = {} as Request;
    const res = createMockRes();
    const error = new Error("get failed");
    res.locals = { params: { courseId: "c-1", id: "p-1" } };
    (PostService.getPost as jest.Mock).mockRejectedValue(error);

    await PostsController.getPost(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
