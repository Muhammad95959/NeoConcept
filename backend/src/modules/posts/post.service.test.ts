import prisma from "../../config/db";
import CustomError from "../../types/customError";
import { ErrorMessages } from "../../types/errorsMessages";
import { PostModel } from "./post.model";
import { PostService } from "./post.service";

jest.mock("../../config/db", () => ({
  __esModule: true,
  default: {
    course: {
      findFirst: jest.fn(),
    },
  },
}));

jest.mock("./post.model", () => ({
  PostModel: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

describe("PostService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getPosts", () => {
    it("builds search filter and returns posts", async () => {
      (PostModel.findMany as jest.Mock).mockResolvedValue([{ id: "p-1" }]);

      const result = await PostService.getPosts({ courseId: "c-1", search: "intro" });

      expect(PostModel.findMany).toHaveBeenCalledWith({
        courseId: "c-1",
        course: { deletedAt: null },
        OR: [
          { title: { contains: "intro", mode: "insensitive" } },
          { content: { contains: "intro", mode: "insensitive" } },
        ],
      });
      expect(result).toEqual([{ id: "p-1" }]);
    });
  });

  describe("getPost", () => {
    it("throws when post is missing", async () => {
      (PostModel.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(PostService.getPost({ courseId: "c-1", id: "p-404" })).rejects.toMatchObject<Partial<CustomError>>({
        message: ErrorMessages.POST_NOT_FOUND,
        statusCode: 404,
      });
    });
  });

  describe("create", () => {
    it("throws when course is missing", async () => {
      (prisma.course.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        PostService.create({
          courseId: "c-404",
          userId: "u-1",
          title: "hello",
          content: "world",
        }),
      ).rejects.toMatchObject<Partial<CustomError>>({
        message: ErrorMessages.COURSE_NOT_FOUND,
        statusCode: 404,
      });
    });

    it("creates post using trimmed title and content", async () => {
      (prisma.course.findFirst as jest.Mock).mockResolvedValue({ id: "c-1" });
      (PostModel.create as jest.Mock).mockResolvedValue({ id: "p-1" });

      const result = await PostService.create({
        courseId: "c-1",
        userId: "u-1",
        title: "  Intro  ",
        content: "  Welcome  ",
      });

      expect(PostModel.create).toHaveBeenCalledWith({
        title: "Intro",
        content: "Welcome",
        courseId: "c-1",
        uploadedBy: "u-1",
      });
      expect(result).toEqual({ id: "p-1" });
    });
  });

  describe("update", () => {
    it("throws unauthorized when non-owner updates", async () => {
      (PostModel.findFirst as jest.Mock).mockResolvedValue({ id: "p-1", uploadedBy: "u-2" });

      await expect(
        PostService.update({
          courseId: "c-1",
          id: "p-1",
          userId: "u-1",
          title: "Updated",
          content: "",
        }),
      ).rejects.toMatchObject<Partial<CustomError>>({
        message: ErrorMessages.UNAUTHORIZED,
        statusCode: 401,
      });
    });
  });

  describe("delete", () => {
    it("deletes post when requester is owner", async () => {
      (PostModel.findFirst as jest.Mock).mockResolvedValue({ id: "p-1", uploadedBy: "u-1" });

      await PostService.delete({ courseId: "c-1", id: "p-1", userId: "u-1" });

      expect(PostModel.delete).toHaveBeenCalledWith("p-1");
    });
  });
});
