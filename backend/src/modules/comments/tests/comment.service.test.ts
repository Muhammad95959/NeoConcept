import CustomError from "../../../types/customError";
import { ErrorMessages } from "../../../types/errorsMessages";
import { CommentModel } from "../comment.model";
import { CommentService } from "../comment.service";

jest.mock("../comment.model", () => ({
  CommentModel: {
    findMany: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
}));

describe("CommentService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getMany", () => {
    it("returns comments for post", async () => {
      (CommentModel.findMany as jest.Mock).mockResolvedValue([{ id: "c-1" }]);

      const result = await CommentService.getMany({ postId: "p-1" });

      expect(CommentModel.findMany).toHaveBeenCalledWith("p-1");
      expect(result).toEqual([{ id: "c-1" }]);
    });
  });

  describe("get", () => {
    it("throws when comment not found", async () => {
      (CommentModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(CommentService.get({ postId: "p-1", id: "c-404" })).rejects.toMatchObject<Partial<CustomError>>({
        message: ErrorMessages.COMMENT_NOT_FOUND,
        statusCode: 404,
      });
    });

    it("returns comment when found", async () => {
      const comment = { id: "c-1", content: "Hello" };
      (CommentModel.findById as jest.Mock).mockResolvedValue(comment);

      const result = await CommentService.get({ postId: "p-1", id: "c-1" });

      expect(result).toEqual(comment);
    });
  });

  describe("create", () => {
    it("creates comment with userId", async () => {
      const newComment = { id: "c-1", content: "Hello" };
      (CommentModel.create as jest.Mock).mockResolvedValue(newComment);

      const result = await CommentService.create({ postId: "p-1", userId: "u-1", content: "Hello" });

      expect(CommentModel.create).toHaveBeenCalledWith({
        content: "Hello",
        postId: "p-1",
        userId: "u-1",
      });
      expect(result).toEqual(newComment);
    });
  });

  describe("update", () => {
    it("throws when comment not found", async () => {
      (CommentModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(CommentService.update({ postId: "p-1", id: "c-404", userId: "u-1", content: "Updated" })).rejects.toMatchObject<Partial<CustomError>>({
        message: ErrorMessages.COMMENT_NOT_FOUND,
        statusCode: 404,
      });
    });

    it("throws unauthorized when non-owner updates", async () => {
      (CommentModel.findById as jest.Mock).mockResolvedValue({ id: "c-1", userId: "u-2" });

      await expect(CommentService.update({ postId: "p-1", id: "c-1", userId: "u-1", content: "Updated" })).rejects.toMatchObject<Partial<CustomError>>({
        message: ErrorMessages.UNAUTHORIZED,
        statusCode: 403,
      });
    });

    it("updates comment when owner", async () => {
      const updatedComment = { id: "c-1", content: "Updated" };
      (CommentModel.findById as jest.Mock).mockResolvedValue({ id: "c-1", userId: "u-1" });
      (CommentModel.update as jest.Mock).mockResolvedValue(updatedComment);

      const result = await CommentService.update({ postId: "p-1", id: "c-1", userId: "u-1", content: "Updated" });

      expect(CommentModel.update).toHaveBeenCalledWith("c-1", { content: "Updated" });
      expect(result).toEqual(updatedComment);
    });
  });

  describe("delete", () => {
    it("throws when comment not found", async () => {
      (CommentModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(CommentService.delete({ postId: "p-1", id: "c-404" })).rejects.toMatchObject<Partial<CustomError>>({
        message: ErrorMessages.COMMENT_NOT_FOUND,
        statusCode: 404,
      });
    });

    it("deletes comment when found", async () => {
      (CommentModel.findById as jest.Mock).mockResolvedValue({ id: "c-1" });

      await CommentService.delete({ postId: "p-1", id: "c-1" });

      expect(CommentModel.delete).toHaveBeenCalledWith("c-1");
    });
  });

  describe("count", () => {
    it("returns comment count for a post", async () => {
      (CommentModel.count as jest.Mock).mockResolvedValue(7);

      const result = await CommentService.count({ postId: "p-1" });

      expect(CommentModel.count).toHaveBeenCalledWith("p-1");
      expect(result).toEqual(7);
    });
  });
});
