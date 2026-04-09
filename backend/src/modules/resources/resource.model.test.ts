import prisma from "../../config/db";
import { ResourceModel } from "./resource.model";

jest.mock("../../config/db", () => ({
  __esModule: true,
  default: {
    course: { findFirst: jest.fn() },
    resource: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe("ResourceModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("findCourseById queries active course", async () => {
    (prisma.course.findFirst as jest.Mock).mockResolvedValue({ id: "c-1" });

    await ResourceModel.findCourseById("c-1");

    expect(prisma.course.findFirst).toHaveBeenCalledWith({ where: { id: "c-1", deletedAt: null } });
  });

  it("findResourceById queries by id", async () => {
    await ResourceModel.findResourceById("r-1");
    expect(prisma.resource.findUnique).toHaveBeenCalledWith({ where: { id: "r-1" } });
  });

  it("findManyByCourse queries by courseId", async () => {
    await ResourceModel.findManyByCourse("c-1");
    expect(prisma.resource.findMany).toHaveBeenCalledWith({ where: { courseId: "c-1" } });
  });

  it("create proxies data", async () => {
    const data = { courseId: "c-1", fileName: "a.pdf" };
    await ResourceModel.create(data);
    expect(prisma.resource.create).toHaveBeenCalledWith({ data });
  });

  it("delete proxies id", async () => {
    await ResourceModel.delete("r-1");
    expect(prisma.resource.delete).toHaveBeenCalledWith({ where: { id: "r-1" } });
  });
});
