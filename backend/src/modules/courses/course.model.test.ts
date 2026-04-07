import prisma from "../../config/db";
import { CourseModel } from "./course.model";

jest.mock("../../config/db", () => ({
  __esModule: true,
  default: {
    course: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    user: { findMany: jest.fn() },
    userCourse: { deleteMany: jest.fn(), createMany: jest.fn() },
    track: { findFirst: jest.fn() },
    $transaction: jest.fn(),
  },
}));

describe("CourseModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("findMany includes track and courseUsers", async () => {
    const rows = [{ id: "c-1" }];
    (prisma.course.findMany as jest.Mock).mockResolvedValue(rows);

    const result = await CourseModel.findMany({ deletedAt: null });

    expect(prisma.course.findMany).toHaveBeenCalledWith({
      where: { deletedAt: null },
      include: { track: true, courseUsers: true },
    });
    expect(result).toEqual(rows);
  });

  it("findById filters deleted and includes relations", async () => {
    await CourseModel.findById("c-1");

    expect(prisma.course.findFirst).toHaveBeenCalledWith({
      where: { id: "c-1", deletedAt: null },
      include: { track: true, courseUsers: true },
    });
  });

  it("findDuplicate supports excludeId", async () => {
    await CourseModel.findDuplicate("t-1", "React", "c-9");

    expect(prisma.course.findFirst).toHaveBeenCalledWith({
      where: {
        trackId: "t-1",
        deletedAt: null,
        name: { equals: "React", mode: "insensitive" },
        NOT: { id: "c-9" },
      },
    });
  });

  it("create and update delegate to prisma", async () => {
    await CourseModel.create({ name: "A" });
    await CourseModel.update("c-1", { name: "B" });

    expect(prisma.course.create).toHaveBeenCalledWith({ data: { name: "A" } });
    expect(prisma.course.update).toHaveBeenCalledWith({ where: { id: "c-1" }, data: { name: "B" } });
  });

  it("softDelete sets deletedAt", async () => {
    await CourseModel.softDelete("c-1");

    expect(prisma.course.update).toHaveBeenCalledWith({
      where: { id: "c-1" },
      data: { deletedAt: expect.any(Date) },
    });
  });

  it("user and staff helper queries delegate", async () => {
    await CourseModel.findUsersByIds(["u-1"]);
    await CourseModel.findUsersAssignedToTrack(["u-1"], "t-1");

    expect(prisma.user.findMany).toHaveBeenNthCalledWith(1, {
      where: { id: { in: ["u-1"] }, deletedAt: null },
    });
    expect(prisma.user.findMany).toHaveBeenNthCalledWith(2, {
      where: {
        id: { in: ["u-1"] },
        deletedAt: null,
        userTracks: { some: { trackId: "t-1", deletedAt: null } },
      },
      select: { id: true },
    });
  });

  it("course users and track helpers delegate", async () => {
    await CourseModel.deleteCourseUsers("c-1");
    await CourseModel.createCourseUsers([{ userId: "u-1", courseId: "c-1" }]);
    await CourseModel.findTrackById("t-1");

    expect(prisma.userCourse.deleteMany).toHaveBeenCalledWith({ where: { courseId: "c-1" } });
    expect(prisma.userCourse.createMany).toHaveBeenCalledWith({ data: [{ userId: "u-1", courseId: "c-1" }] });
    expect(prisma.track.findFirst).toHaveBeenCalledWith({ where: { id: "t-1", deletedAt: null } });
  });

  it("transaction proxies callback", async () => {
    const cb = jest.fn();
    await CourseModel.transaction(cb);
    expect(prisma.$transaction).toHaveBeenCalledWith(cb);
  });
});
