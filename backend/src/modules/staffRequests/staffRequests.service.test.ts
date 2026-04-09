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

  describe("getMany", () => {
    it("returns empty array when user has no tracks", async () => {
      (StaffRequestModel.findTrackIdsByUser as jest.Mock).mockResolvedValue([]);

      const result = await StaffRequestService.getMany("u-1");

      expect(result).toEqual([]);
      expect(StaffRequestModel.findManyByTrackIds).not.toHaveBeenCalled();
    });

    it("returns staff requests by track ids", async () => {
      const requests = [{ id: "sr-1", userId: "u-2", courseId: "c-1" }];
      (StaffRequestModel.findTrackIdsByUser as jest.Mock).mockResolvedValue([
        { trackId: "t-1" },
        { trackId: "t-2" },
      ]);
      (StaffRequestModel.findManyByTrackIds as jest.Mock).mockResolvedValue(requests);

      const result = await StaffRequestService.getMany("u-1");

      expect(StaffRequestModel.findManyByTrackIds).toHaveBeenCalledWith(["t-1", "t-2"]);
      expect(result).toEqual(requests);
    });
  });

  describe("get", () => {
    it("returns request when found", async () => {
      const request = { id: "sr-1", userId: "u-2", status: Status.PENDING };
      (StaffRequestModel.findById as jest.Mock).mockResolvedValue(request);

      const result = await StaffRequestService.get("sr-1");

      expect(result).toEqual(request);
    });

    it("throws when request not found", async () => {
      (StaffRequestModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(StaffRequestService.get("sr-404")).rejects.toMatchObject<Partial<CustomError>>({
        message: ErrorMessages.REQUEST_NOT_FOUND,
        statusCode: 404,
      });
    });
  });

  describe("create", () => {
    it("throws when course does not exist", async () => {
      (StaffRequestModel.findCourse as jest.Mock).mockResolvedValue(null);

      await expect(StaffRequestService.create("u-1", "c-404", "please add me")).rejects.toMatchObject<
        Partial<CustomError>
      >({
        message: ErrorMessages.COURSE_NOT_FOUND,
        statusCode: 404,
      });
    });

    it("throws when pending request already exists", async () => {
      (StaffRequestModel.findCourse as jest.Mock).mockResolvedValue({ id: "c-1" });
      (StaffRequestModel.findPendingRequest as jest.Mock).mockResolvedValue({ id: "sr-1" });

      await expect(StaffRequestService.create("u-1", "c-1")).rejects.toMatchObject<Partial<CustomError>>({
        message: ErrorMessages.YOU_ALREADY_HAVE_A_PENDING_REQUEST_FOR_THIS_COURSE,
        statusCode: 400,
      });
    });

    it("creates request when course exists and no pending request", async () => {
      const created = { id: "sr-2", userId: "u-1", courseId: "c-1", message: "test" };
      (StaffRequestModel.findCourse as jest.Mock).mockResolvedValue({ id: "c-1" });
      (StaffRequestModel.findPendingRequest as jest.Mock).mockResolvedValue(null);
      (StaffRequestModel.create as jest.Mock).mockResolvedValue(created);

      const result = await StaffRequestService.create("u-1", "c-1", "test");

      expect(StaffRequestModel.create).toHaveBeenCalledWith({
        userId: "u-1",
        courseId: "c-1",
        message: "test",
      });
      expect(result).toEqual(created);
    });
  });

  describe("update", () => {
    it("throws when request not found", async () => {
      (StaffRequestModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(StaffRequestService.update("sr-404", "u-1", "new message")).rejects.toMatchObject<
        Partial<CustomError>
      >({
        message: ErrorMessages.REQUEST_NOT_FOUND,
        statusCode: 404,
      });
    });

    it("throws when requester does not own the request", async () => {
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

    it("throws when request is not pending", async () => {
      (StaffRequestModel.findById as jest.Mock).mockResolvedValue({
        id: "sr-1",
        userId: "u-1",
        status: Status.APPROVED,
      });

      await expect(StaffRequestService.update("sr-1", "u-1", "new message")).rejects.toMatchObject<
        Partial<CustomError>
      >({
        message: ErrorMessages.ONLY_PENDING_REQUESTS_CAN_BE_UPDATED,
        statusCode: 400,
      });
    });

    it("updates pending request message", async () => {
      const updated = { id: "sr-1", userId: "u-1", status: Status.PENDING, message: "updated" };
      (StaffRequestModel.findById as jest.Mock).mockResolvedValue({
        id: "sr-1",
        userId: "u-1",
        status: Status.PENDING,
      });
      (StaffRequestModel.update as jest.Mock).mockResolvedValue(updated);

      const result = await StaffRequestService.update("sr-1", "u-1", "updated");

      expect(StaffRequestModel.update).toHaveBeenCalledWith("sr-1", { message: "updated" });
      expect(result).toEqual(updated);
    });
  });

  describe("answer", () => {
    it("throws when request not found", async () => {
      (StaffRequestModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(StaffRequestService.answer("sr-404", Status.APPROVED)).rejects.toMatchObject<Partial<CustomError>>({
        message: ErrorMessages.REQUEST_NOT_FOUND,
        statusCode: 404,
      });
    });

    it("throws when request already answered", async () => {
      (StaffRequestModel.findById as jest.Mock).mockResolvedValue({
        id: "sr-1",
        status: Status.APPROVED,
      });

      await expect(StaffRequestService.answer("sr-1", Status.REJECTED)).rejects.toMatchObject<Partial<CustomError>>({
        message: ErrorMessages.REQUEST_ALREADY_ANSWERED,
        statusCode: 400,
      });
    });

    it("approves and upserts course membership", async () => {
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

    it("rejects without creating course membership", async () => {
      const tx = {
        staffRequest: { update: jest.fn().mockResolvedValue({}) },
        userCourse: { upsert: jest.fn() },
      };

      (StaffRequestModel.findById as jest.Mock).mockResolvedValue({
        id: "sr-1",
        userId: "u-1",
        courseId: "c-1",
        status: Status.PENDING,
        user: { role: Role.INSTRUCTOR },
      });
      (StaffRequestModel.transaction as jest.Mock).mockImplementation(async (cb: any) => cb(tx));

      const result = await StaffRequestService.answer("sr-1", Status.REJECTED);

      expect(tx.userCourse.upsert).not.toHaveBeenCalled();
      expect(result).toBe("Request rejected successfully");
    });
  });

  describe("delete", () => {
    it("throws when request not found", async () => {
      (StaffRequestModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(StaffRequestService.delete("sr-404", "u-1")).rejects.toMatchObject<Partial<CustomError>>({
        message: ErrorMessages.REQUEST_NOT_FOUND,
        statusCode: 404,
      });
    });

    it("throws when not owned by requester", async () => {
      (StaffRequestModel.findById as jest.Mock).mockResolvedValue({
        id: "sr-1",
        userId: "u-owner",
        status: Status.PENDING,
      });

      await expect(StaffRequestService.delete("sr-1", "u-other")).rejects.toMatchObject<Partial<CustomError>>({
        message: ErrorMessages.YOU_CAN_ONLY_DELETE_YOUR_OWN_REQUESTS,
        statusCode: 403,
      });
    });

    it("throws when request is not pending", async () => {
      (StaffRequestModel.findById as jest.Mock).mockResolvedValue({
        id: "sr-1",
        userId: "u-1",
        status: Status.APPROVED,
      });

      await expect(StaffRequestService.delete("sr-1", "u-1")).rejects.toMatchObject<Partial<CustomError>>({
        message: ErrorMessages.ONLY_PENDING_REQUESTS_CAN_BE_DELETED,
        statusCode: 400,
      });
    });

    it("deletes request when owner and pending", async () => {
      (StaffRequestModel.findById as jest.Mock).mockResolvedValue({
        id: "sr-1",
        userId: "u-1",
        status: Status.PENDING,
      });

      await StaffRequestService.delete("sr-1", "u-1");

      expect(StaffRequestModel.delete).toHaveBeenCalledWith("sr-1");
    });
  });
});
