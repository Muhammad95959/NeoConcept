import { Role, Status } from "../../generated/prisma";
import CustomError from "../../types/customError";
import { ErrorMessages } from "../../types/errorsMessages";
import { StudentRequestModel } from "./studentRequests.model";
import { StudentRequestService } from "./studentRequests.service";

jest.mock("./studentRequests.model", () => ({
  StudentRequestModel: {
    findById: jest.fn(),
    findCourse: jest.fn(),
    findStaffMember: jest.fn(),
    findEnrollment: jest.fn(),
    findPendingRequest: jest.fn(),
    findManyByCourse: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    transaction: jest.fn(),
  },
}));

describe("StudentRequestService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getMany throws when requester is not staff", async () => {
    (StudentRequestModel.findCourse as jest.Mock).mockResolvedValue({ id: "c-1" });
    (StudentRequestModel.findStaffMember as jest.Mock).mockResolvedValue(null);

    await expect(StudentRequestService.getMany("u-1", "c-1", Status.PENDING)).rejects.toMatchObject<
      Partial<CustomError>
    >({
      message: ErrorMessages.YOU_ARE_NOT_A_STAFF_MEMBER_OF_THIS_COURSE,
      statusCode: 403,
    });
  });

  it("create throws when course is not protected", async () => {
    (StudentRequestModel.findCourse as jest.Mock).mockResolvedValue({ id: "c-1", protected: false });
    (StudentRequestModel.findEnrollment as jest.Mock).mockResolvedValue(null);

    await expect(StudentRequestService.create("u-1", "c-1")).rejects.toMatchObject<Partial<CustomError>>({
      message: ErrorMessages.THIS_COURSE_IS_NOT_PROTECTED,
      statusCode: 400,
    });
  });

  it("create throws when pending request already exists", async () => {
    (StudentRequestModel.findCourse as jest.Mock).mockResolvedValue({ id: "c-1", protected: true });
    (StudentRequestModel.findEnrollment as jest.Mock).mockResolvedValue(null);
    (StudentRequestModel.findPendingRequest as jest.Mock).mockResolvedValue({ id: "st-1" });

    await expect(StudentRequestService.create("u-1", "c-1")).rejects.toMatchObject<Partial<CustomError>>({
      message: ErrorMessages.YOU_HAVE_ALREADY_SUBMITTED_A_REQUEST_FOR_THIS_COURSE,
      statusCode: 400,
    });
  });

  it("answer approves and upserts student course membership", async () => {
    const tx = {
      studentRequest: { update: jest.fn().mockResolvedValue({}) },
      userCourse: { upsert: jest.fn().mockResolvedValue({}) },
    };

    (StudentRequestModel.findById as jest.Mock).mockResolvedValue({
      id: "st-1",
      userId: "u-2",
      courseId: "c-1",
      status: Status.PENDING,
    });
    (StudentRequestModel.findStaffMember as jest.Mock).mockResolvedValue({ id: "uc-1" });
    (StudentRequestModel.transaction as jest.Mock).mockImplementation(async (cb: any) => cb(tx));

    const result = await StudentRequestService.answer("u-staff", "st-1", Status.APPROVED);

    expect(tx.studentRequest.update).toHaveBeenCalledWith({ where: { id: "st-1" }, data: { status: Status.APPROVED } });
    expect(tx.userCourse.upsert).toHaveBeenCalledWith({
      where: {
        userId_courseId: {
          userId: "u-2",
          courseId: "c-1",
        },
      },
      create: {
        userId: "u-2",
        courseId: "c-1",
        roleInCourse: Role.STUDENT,
      },
      update: {
        roleInCourse: Role.STUDENT,
        deletedAt: null,
      },
    });
    expect(result).toBe("Request approved successfully");
  });

  it("delete throws when requester is not owner", async () => {
    (StudentRequestModel.findById as jest.Mock).mockResolvedValue({
      id: "st-1",
      userId: "u-owner",
      status: Status.PENDING,
    });

    await expect(StudentRequestService.delete("u-other", "st-1")).rejects.toMatchObject<Partial<CustomError>>({
      message: ErrorMessages.YOU_CAN_ONLY_DELETE_YOUR_OWN_REQUESTS,
      statusCode: 403,
    });
  });

  it("delete removes pending request owned by requester", async () => {
    (StudentRequestModel.findById as jest.Mock).mockResolvedValue({
      id: "st-1",
      userId: "u-1",
      status: Status.PENDING,
    });

    await StudentRequestService.delete("u-1", "st-1");

    expect(StudentRequestModel.delete).toHaveBeenCalledWith("st-1");
  });
});

  it("create throws when already enrolled", async () => {
    (StudentRequestModel.findCourse as jest.Mock).mockResolvedValue({ id: "c-1", protected: true });
    (StudentRequestModel.findEnrollment as jest.Mock).mockResolvedValue({ id: "uc-1" });

    await expect(StudentRequestService.create("u-1", "c-1")).rejects.toMatchObject<Partial<CustomError>>({
      message: ErrorMessages.YOU_ARE_ALREADY_ENROLLED_IN_THIS_COURSE,
      statusCode: 400,
    });
  });

  it("create throws when course not found", async () => {
    (StudentRequestModel.findCourse as jest.Mock).mockResolvedValue(null);

    await expect(StudentRequestService.create("u-1", "c-404")).rejects.toMatchObject<Partial<CustomError>>({
      message: ErrorMessages.COURSE_NOT_FOUND,
      statusCode: 404,
    });
  });

  it("create succeeds when all validations pass", async () => {
    const created = { id: "st-1", userId: "u-1", courseId: "c-1" };
    (StudentRequestModel.findCourse as jest.Mock).mockResolvedValue({ id: "c-1", protected: true });
    (StudentRequestModel.findEnrollment as jest.Mock).mockResolvedValue(null);
    (StudentRequestModel.findPendingRequest as jest.Mock).mockResolvedValue(null);
    (StudentRequestModel.create as jest.Mock).mockResolvedValue(created);

    const result = await StudentRequestService.create("u-1", "c-1");

    expect(StudentRequestModel.create).toHaveBeenCalledWith({ courseId: "c-1", userId: "u-1" });
    expect(result).toEqual(created);
  });

  it("getMany throws when course not found", async () => {
    (StudentRequestModel.findCourse as jest.Mock).mockResolvedValue(null);

    await expect(StudentRequestService.getMany("u-1", "c-404")).rejects.toMatchObject<Partial<CustomError>>({
      message: ErrorMessages.COURSE_NOT_FOUND,
      statusCode: 404,
    });
  });

  it("getMany returns requests when requester is staff", async () => {
    const requests = [{ id: "st-1", status: Status.PENDING }];
    (StudentRequestModel.findCourse as jest.Mock).mockResolvedValue({ id: "c-1" });
    (StudentRequestModel.findStaffMember as jest.Mock).mockResolvedValue({ id: "uc-1" });
    (StudentRequestModel.findManyByCourse as jest.Mock).mockResolvedValue(requests);

    const result = await StudentRequestService.getMany("u-staff", "c-1", Status.PENDING);

    expect(StudentRequestModel.findManyByCourse).toHaveBeenCalledWith("c-1", Status.PENDING);
    expect(result).toEqual(requests);
  });

  it("getById throws when not staff", async () => {
    (StudentRequestModel.findById as jest.Mock).mockResolvedValue({ id: "st-1", courseId: "c-1" });
    (StudentRequestModel.findStaffMember as jest.Mock).mockResolvedValue(null);

    await expect(StudentRequestService.getById("u-1", "st-1")).rejects.toMatchObject<Partial<CustomError>>({
      message: ErrorMessages.YOU_ARE_NOT_A_STAFF_MEMBER_OF_THIS_COURSE,
      statusCode: 403,
    });
  });

  it("getById returns request when requester is staff", async () => {
    const request = { id: "st-1", courseId: "c-1", userId: "u-2" };
    (StudentRequestModel.findById as jest.Mock).mockResolvedValue(request);
    (StudentRequestModel.findStaffMember as jest.Mock).mockResolvedValue({ id: "uc-1" });

    const result = await StudentRequestService.getById("u-staff", "st-1");

    expect(result).toEqual(request);
  });

  it("answer denies without upsert", async () => {
    const tx = {
      studentRequest: { update: jest.fn().mockResolvedValue({}) },
      userCourse: { upsert: jest.fn() },
    };

    (StudentRequestModel.findById as jest.Mock).mockResolvedValue({
      id: "st-1",
      userId: "u-2",
      courseId: "c-1",
      status: Status.PENDING,
    });
    (StudentRequestModel.findStaffMember as jest.Mock).mockResolvedValue({ id: "uc-1" });
    (StudentRequestModel.transaction as jest.Mock).mockImplementation(async (cb: any) => cb(tx));

    const result = await StudentRequestService.answer("u-staff", "st-1", Status.REJECTED);

    expect(tx.studentRequest.update).toHaveBeenCalledWith({ where: { id: "st-1" }, data: { status: Status.REJECTED } });
    expect(tx.userCourse.upsert).not.toHaveBeenCalled();
    expect(result).toBe("Request rejected successfully");
  });

  it("delete throws when not owner", async () => {
    (StudentRequestModel.findById as jest.Mock).mockResolvedValue({
      id: "st-1",
      userId: "u-owner",
      status: Status.PENDING,
    });

    await expect(StudentRequestService.delete("u-other", "st-1")).rejects.toMatchObject<Partial<CustomError>>({
      message: ErrorMessages.YOU_CAN_ONLY_DELETE_YOUR_OWN_REQUESTS,
      statusCode: 403,
    });
  });

  it("delete throws when not pending", async () => {
    (StudentRequestModel.findById as jest.Mock).mockResolvedValue({
      id: "st-1",
      userId: "u-1",
      status: Status.APPROVED,
    });

    await expect(StudentRequestService.delete("u-1", "st-1")).rejects.toMatchObject<Partial<CustomError>>({
      message: ErrorMessages.ONLY_PENDING_REQUESTS_CAN_BE_DELETED,
      statusCode: 400,
    });
  });

  it("delete removes pending request owned by user", async () => {
    (StudentRequestModel.findById as jest.Mock).mockResolvedValue({
      id: "st-1",
      userId: "u-1",
      status: Status.PENDING,
    });

    await StudentRequestService.delete("u-1", "st-1");

    expect(StudentRequestModel.delete).toHaveBeenCalledWith("st-1");
  });
