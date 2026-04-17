import prisma from "../../../config/db";
import { CommentModel } from "../comment.model";

jest.mock("../../../config/db", () => ({
  __esModule: true,
  default: {
    comment: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  },
}));

describe("CommentModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("findMany returns comments ordered by createdAt", async () => {
    const rows = [{ id: "c-1" }, { id: "c-2" }];
    (prisma.comment.findMany as jest.Mock).mockResolvedValue(rows);

    const result = await CommentModel.findMany("p-1");

    expect(prisma.comment.findMany).toHaveBeenCalledWith({
      where: { postId: "p-1" },
      orderBy: { createdAt: "asc" },
    });
    expect(result).toEqual(rows);
  });

  it("findById returns first comment matching postId and id", async () => {
    const row = { id: "c-1" };
    (prisma.comment.findFirst as jest.Mock).mockResolvedValue(row);

    const result = await CommentModel.findById("p-1", "c-1");

    expect(prisma.comment.findFirst).toHaveBeenCalledWith({
      where: { postId: "p-1", id: "c-1" },
    });
    expect(result).toEqual(row);
  });

  it("create proxies data", async () => {
    const row = { id: "c-1", content: "Hello" };
    (prisma.comment.create as jest.Mock).mockResolvedValue(row);

    const result = await CommentModel.create({ content: "Hello", postId: "p-1", userId: "u-1" });

    expect(prisma.comment.create).toHaveBeenCalledWith({
      data: { content: "Hello", postId: "p-1", userId: "u-1" },
    });
    expect(result).toEqual(row);
  });

  it("update proxies id and data", async () => {
    const row = { id: "c-1", content: "Updated" };
    (prisma.comment.update as jest.Mock).mockResolvedValue(row);

    const result = await CommentModel.update("c-1", { content: "Updated" });

    expect(prisma.comment.update).toHaveBeenCalledWith({
      where: { id: "c-1" },
      data: { content: "Updated" },
    });
    expect(result).toEqual(row);
  });

  it("delete proxies id", async () => {
    (prisma.comment.delete as jest.Mock).mockResolvedValue({ id: "c-1" });

    await CommentModel.delete("c-1");

    expect(prisma.comment.delete).toHaveBeenCalledWith({ where: { id: "c-1" } });
  });

  it("count returns number of comments for a post", async () => {
    (prisma.comment.count as jest.Mock).mockResolvedValue(10);

    const result = await CommentModel.count("p-1");

    expect(prisma.comment.count).toHaveBeenCalledWith({ where: { postId: "p-1" } });
    expect(result).toEqual(10);
  });
});
