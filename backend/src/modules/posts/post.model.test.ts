import prisma from "../../config/db";
import { PostModel } from "./post.model";

jest.mock("../../config/db", () => ({
  __esModule: true,
  default: {
    post: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe("PostModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("findMany proxies where clause", async () => {
    const rows = [{ id: "p-1" }];
    (prisma.post.findMany as jest.Mock).mockResolvedValue(rows);

    const result = await PostModel.findMany({ courseId: "c-1" });

    expect(prisma.post.findMany).toHaveBeenCalledWith({ where: { courseId: "c-1" } });
    expect(result).toEqual(rows);
  });

  it("findFirst proxies where clause", async () => {
    const row = { id: "p-1" };
    (prisma.post.findFirst as jest.Mock).mockResolvedValue(row);

    const result = await PostModel.findFirst({ id: "p-1" });

    expect(prisma.post.findFirst).toHaveBeenCalledWith({ where: { id: "p-1" } });
    expect(result).toEqual(row);
  });

  it("create proxies data", async () => {
    const row = { id: "p-1", title: "Hello" };
    (prisma.post.create as jest.Mock).mockResolvedValue(row);

    const result = await PostModel.create({ title: "Hello" });

    expect(prisma.post.create).toHaveBeenCalledWith({ data: { title: "Hello" } });
    expect(result).toEqual(row);
  });

  it("update proxies id and data", async () => {
    const row = { id: "p-1", title: "Updated" };
    (prisma.post.update as jest.Mock).mockResolvedValue(row);

    const result = await PostModel.update("p-1", { title: "Updated" });

    expect(prisma.post.update).toHaveBeenCalledWith({ where: { id: "p-1" }, data: { title: "Updated" } });
    expect(result).toEqual(row);
  });

  it("delete proxies id", async () => {
    (prisma.post.delete as jest.Mock).mockResolvedValue({ id: "p-1" });

    await PostModel.delete("p-1");

    expect(prisma.post.delete).toHaveBeenCalledWith({ where: { id: "p-1" } });
  });
});
