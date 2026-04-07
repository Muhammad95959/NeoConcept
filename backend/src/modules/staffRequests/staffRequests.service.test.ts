import { Role, Status } from "../../generated/prisma";
import CustomError from "../../types/customError";
import { ErrorMessages } from "../../types/errorsMessages";
import { StaffRequestModel } from "./staffRequests.model";
import { StaffRequestService } from "./staffRequests.service";

jest.mock("./staffRequests.model", () => ({
  StaffRequestModel: {
    findTrackIdsByUser: jest.fn(),
    findManyByTrackIds: jest.fn(),
    findById: jest.fn(),
    findCourse: jest.fn(),
    findPendingRequest: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    transaction: jest.fn(),
  },
}));

describe("StaffRequestService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getMany returns empty array when user has no tracks", async () => {
    (StaffRequestModel.findTrackIdsByUser as jest.Mock).mockResolvedValue([]);

    const result = await StaffRequestService.getMany("u-1");

    expect(result).toEqual([]);
    expect(StaffRequestModel.findManyByTrackIds).not.toHaveBeenCalled();
  });

  it("create throws when course does not exist", async () => {
    (StaffRequestModel.findCourse as jest.Mock).mockResolvedValue(null);

    await expect(StaffRequestService.create("u-1", "c-404", "please add me")).rejects.toMatchObject<
      Partial<CustomError>
    >({
      message: ErrorMessages.COURSE_NOT_FOUND,
      statusCode: 404,
    });
  });

  it("create throws when pending request already exists", async () => {
    (StaffRequestModel.findCourse as jest.Mock).mockResolvedValue({ id: "c-1" });
    (StaffRequestModel.findPendingRequest as jest.Mock).mockResolvedValue({ id: "sr-1" });

    await expect(StaffRequestService.create("u-1", "c-1")).rejects.toMatchObject<Partial<CustomError>>({
      message: ErrorMessages.YOU_ALREADY_HAVE_A_PENDING_REQUEST_FOR_THIS_COURSE,
      statusCode: 400,
    });
  });

  it("update throws when requester does not own the request", async () => {
    (StaffRequestModel.findById as jest.Mock).mockResolvedValue({
      id: "sr-1",
      userId: "u-owner",
      status: Status.PENDING,
    });

    await expect(StaffRequestService.update("sr-1", "u-other", "new message")).rejects.toMatchObject<
      Partial<CustomError>
    >({
      message: ErrorMessages.YOU_CAN_ONLY_UPDATE_YOUR_OWN_REQUESTS,
      statusCode: 401,
    });
  });

  it("answer approves and upserts course membership", async () => {
    const tx = {
      staffRequest: { update: jest.fn().mockResolvedValue({}) },
      userCourse: { upsert: jest.fn().mockResolvedValue({}) },
    };

    (StaffRequestModel.findById as jest.Mock).mockResolvedValue({
      id: "sr-1",
      userId: "u-1",
      courseId: "c-1",
      status: Status.PENDING,
      user: { role: Role.INSTRUCTOR },
    });
    (StaffRequestModel.transaction as jest.Mock).mockImplementation(async (cb: any) => cb(tx));

    const result = await StaffRequestService.answer("sr-1", Status.APPROVED);

    expect(tx.staffRequest.update).toHaveBeenCalledWith({
      where: { id: "sr-1" },
      data: { status: Status.APPROVED },
    });
    expect(tx.userCourse.upsert).toHaveBeenCalledWith({
      where: {
        userId_courseId: {
          userId: "u-1",
          courseId: "c-1",
        },
      },
      create: {
        userId: "u-1",
        courseId: "c-1",
        roleInCourse: Role.INSTRUCTOR,
      },
      update: {
        roleInCourse: Role.INSTRUCTOR,
        deletedAt: null,
      },
    });
    expect(result).toBe("Request approved successfully");
  });

  it("delete removes request when owner and pending", async () => {
    (StaffRequestModel.findById as jest.Mock).mockResolvedValue({
      id: "sr-1",
      userId: "u-1",
      status: Status.PENDING,
    });

    await StaffRequestService.delete("sr-1", "u-1");

    expect(StaffRequestModel.delete).toHaveBeenCalledWith("sr-1");
  });
});
