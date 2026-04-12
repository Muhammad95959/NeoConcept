import crypto from "crypto";
import prisma from "../../config/db";
import CustomError from "../../types/customError";
import { ErrorMessages } from "../../types/errorsMessages";
import { MeetingModel } from "./meeting.model";
import { MeetingService } from "./meeting.service";
import { createCalendarEvent } from "../../utils/googleCalendar";
import { stringToUid } from "../../utils/stringToUid";
import { generateAgoraToken } from "../../utils/agoraToken";

jest.mock("../../config/db", () => ({
  __esModule: true,
  default: {
    meeting: {
      update: jest.fn(),
    },
  },
}));

jest.mock("./meeting.model", () => ({
  MeetingModel: {
    create: jest.fn(),
    findById: jest.fn(),
    findAllByUser: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findParticipant: jest.fn(),
    addParticipant: jest.fn(),
    removeParticipant: jest.fn(),
  },
}));

jest.mock("../../utils/googleCalendar", () => ({
  createCalendarEvent: jest.fn(),
}));

jest.mock("../../utils/stringToUid", () => ({
  stringToUid: jest.fn(),
}));

jest.mock("../../utils/agoraToken", () => ({
  generateAgoraToken: jest.fn(),
}));

describe("MeetingService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    process.env.AGORA_APP_ID = "agora-test-app";
  });

  describe("create", () => {
    it("uses random channel when not provided and skips calendar event", async () => {
      jest.spyOn(crypto, "randomUUID").mockReturnValue("ch-random" as any);
      (MeetingModel.create as jest.Mock).mockResolvedValue({ id: "m-1", title: "Daily" });
      (stringToUid as jest.Mock).mockReturnValue(321);
      (generateAgoraToken as jest.Mock).mockReturnValue("agora-token");

      const result = await MeetingService.create("u-1", "c-1", { title: "Daily" });

      expect(MeetingModel.create).toHaveBeenCalledWith({
        title: "Daily",
        hostId: "u-1",
        courseId: "c-1",
        channelName: "ch-random",
        scheduledAt: null,
      });
      expect(createCalendarEvent).not.toHaveBeenCalled();
      expect(generateAgoraToken).toHaveBeenCalledWith("ch-random", "321");
      expect(result).toEqual({
        meeting: { id: "m-1", title: "Daily" },
        token: "agora-token",
        appID: "agora-test-app",
        channel: "ch-random",
        uid: 321,
        calendarEvent: null,
      });
    });

    it("creates calendar event when scheduledAt is provided", async () => {
      const scheduledAt = new Date("2026-04-08T10:00:00.000Z");
      (MeetingModel.create as jest.Mock).mockResolvedValue({ id: "m-2", title: "Planning" });
      (createCalendarEvent as jest.Mock).mockResolvedValue({ id: "g-1" });
      (stringToUid as jest.Mock).mockReturnValue(555);
      (generateAgoraToken as jest.Mock).mockReturnValue("token-2");

      const result = await MeetingService.create("u-2", "c-1", {
        title: "Planning",
        channelName: "ch-planning",
        scheduledAt,
      });

      expect(createCalendarEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          summary: "Planning",
          description: "Meeting ID: m-2\nChannel: ch-planning",
          startDate: scheduledAt,
        }),
      );
      expect(result.calendarEvent).toEqual({ id: "g-1" });
    });
  });

  describe("getById", () => {
    it("returns meeting when found", async () => {
      const meeting = { id: "m-1", title: "Meeting" };
      (MeetingModel.findById as jest.Mock).mockResolvedValue(meeting);

      const result = await MeetingService.getById("m-1");

      expect(MeetingModel.findById).toHaveBeenCalledWith("m-1");
      expect(result).toEqual(meeting);
    });

    it("throws when meeting not found", async () => {
      (MeetingModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(MeetingService.getById("m-invalid")).rejects.toMatchObject<Partial<CustomError>>({
        message: ErrorMessages.MEETING_NOT_FOUND,
        statusCode: 404,
      });
    });

    it("handles array id parameter", async () => {
      const meeting = { id: "m-1" };
      (MeetingModel.findById as jest.Mock).mockResolvedValue(meeting);

      const result = await MeetingService.getById(["m-1", "m-2"]);

      expect(MeetingModel.findById).toHaveBeenCalledWith("m-1");
      expect(result).toEqual(meeting);
    });
  });

  describe("update", () => {
    it("updates meeting when user is host", async () => {
      jest.spyOn(MeetingService, "checkHost").mockResolvedValue(undefined);
      (MeetingModel.update as jest.Mock).mockResolvedValue({ id: "m-1", title: "Updated" });

      const result = await MeetingService.update("u-host", "m-1", { title: "Updated" });

      expect(MeetingService.checkHost).toHaveBeenCalledWith("u-host", "m-1");
      expect(MeetingModel.update).toHaveBeenCalledWith("m-1", { title: "Updated" });
      expect(result).toEqual({ id: "m-1", title: "Updated" });
    });
  });

  describe("delete", () => {
    it("deletes meeting when user is host", async () => {
      jest.spyOn(MeetingService, "checkHost").mockResolvedValue(undefined);
      (MeetingModel.delete as jest.Mock).mockResolvedValue({ id: "m-1" });

      const result = await MeetingService.delete("u-host", "m-1");

      expect(MeetingService.checkHost).toHaveBeenCalledWith("u-host", "m-1");
      expect(MeetingModel.delete).toHaveBeenCalledWith("m-1");
      expect(result).toEqual({ id: "m-1" });
    });
  });

  describe("joinMeeting", () => {
    it("throws when meeting not found", async () => {
      (MeetingModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(MeetingService.joinMeeting("u-1", "m-invalid")).rejects.toMatchObject<Partial<CustomError>>({
        message: ErrorMessages.MEETING_NOT_FOUND,
        statusCode: 404,
      });
    });

    it("throws when meeting has ended", async () => {
      (MeetingModel.findById as jest.Mock).mockResolvedValue({ id: "m-1", status: "ENDED" });

      await expect(MeetingService.joinMeeting("u-1", "m-1")).rejects.toMatchObject<Partial<CustomError>>({
        message: ErrorMessages.MEETING_ENDED,
        statusCode: 400,
      });
    });

    it("throws when meeting not started", async () => {
      (MeetingModel.findById as jest.Mock).mockResolvedValue({ id: "m-1", status: "SCHEDULED" });

      await expect(MeetingService.joinMeeting("u-1", "m-1")).rejects.toMatchObject<Partial<CustomError>>({
        message: ErrorMessages.MEETING_NOT_STARTED,
        statusCode: 400,
      });
    });

    it("throws when user already in meeting", async () => {
      (MeetingModel.findById as jest.Mock).mockResolvedValue({ id: "m-1", status: "LIVE" });
      (MeetingModel.findParticipant as jest.Mock).mockResolvedValue({ role: "PARTICIPANT" });

      await expect(MeetingService.joinMeeting("u-1", "m-1")).rejects.toMatchObject<Partial<CustomError>>({
        message: ErrorMessages.USER_ALREADY_IN_MEETING,
        statusCode: 400,
      });
    });

    it("adds participant and returns join payload", async () => {
      (MeetingModel.findById as jest.Mock).mockResolvedValue({
        id: "m-1",
        channelName: "ch-live",
        status: "LIVE",
      });
      (MeetingModel.findParticipant as jest.Mock).mockResolvedValue(null);
      (stringToUid as jest.Mock).mockReturnValue(777);
      (generateAgoraToken as jest.Mock).mockReturnValue("join-token");

      const result = await MeetingService.joinMeeting("u-join", "m-1");

      expect(MeetingModel.addParticipant).toHaveBeenCalledWith({ userId: "u-join", meetingId: "m-1" });
      expect(result).toEqual({
        meetingId: "m-1",
        channel: "ch-live",
        uid: 777,
        token: "join-token",
        appID: "agora-test-app",
      });
    });
  });

  describe("leaveMeeting", () => {
    it("throws when participant not found", async () => {
      (MeetingModel.findParticipant as jest.Mock).mockResolvedValue(null);

      await expect(MeetingService.leaveMeeting("u-1", "m-1")).rejects.toMatchObject<Partial<CustomError>>({
        message: ErrorMessages.PARTICIPANT_NOT_FOUND,
        statusCode: 400,
      });
    });

    it("throws when host tries to leave", async () => {
      (MeetingModel.findParticipant as jest.Mock).mockResolvedValue({ role: "HOST" });

      await expect(MeetingService.leaveMeeting("u-1", "m-1")).rejects.toMatchObject<Partial<CustomError>>({
        message: ErrorMessages.HOST_CANNOT_LEAVE_MEETING,
        statusCode: 400,
      });
    });

    it("removes participant when not host", async () => {
      (MeetingModel.findParticipant as jest.Mock).mockResolvedValue({ role: "PARTICIPANT" });
      (MeetingModel.removeParticipant as jest.Mock).mockResolvedValue({});

      const result = await MeetingService.leaveMeeting("u-1", "m-1");

      expect(MeetingModel.removeParticipant).toHaveBeenCalledWith("u-1", "m-1");
      expect(result).toEqual({});
    });
  });

  describe("checkHost", () => {
    it("throws when participant not found", async () => {
      (MeetingModel.findParticipant as jest.Mock).mockResolvedValue(null);

      await expect(MeetingService.checkHost("u-1", "m-1")).rejects.toMatchObject<Partial<CustomError>>({
        message: ErrorMessages.ONLY_HOST_CAN_PERFORM_THIS_ACTION,
        statusCode: 403,
      });
    });

    it("throws when user is not host", async () => {
      (MeetingModel.findParticipant as jest.Mock).mockResolvedValue({ role: "PARTICIPANT" });

      await expect(MeetingService.checkHost("u-1", "m-1")).rejects.toMatchObject<Partial<CustomError>>({
        message: ErrorMessages.ONLY_HOST_CAN_PERFORM_THIS_ACTION,
        statusCode: 403,
      });
    });

    it("succeeds when user is host", async () => {
      (MeetingModel.findParticipant as jest.Mock).mockResolvedValue({ role: "HOST" });

      const result = await MeetingService.checkHost("u-host", "m-1");

      expect(result).toBeUndefined();
    });
  });

  describe("checkParticipant", () => {
    it("throws when meeting id is missing", async () => {
      await expect(MeetingService.checkParticipant("u-1", undefined)).rejects.toMatchObject<Partial<CustomError>>({
        message: ErrorMessages.MEETING_ID_MUST_BE_PROVIDED,
        statusCode: 404,
      });
    });

    it("throws when participant not found", async () => {
      (MeetingModel.findParticipant as jest.Mock).mockResolvedValue(null);

      await expect(MeetingService.checkParticipant("u-1", "m-1")).rejects.toMatchObject<Partial<CustomError>>({
        message: ErrorMessages.PARTICIPANT_NOT_FOUND,
        statusCode: 403,
      });
    });
  });

  describe("startMeeting", () => {
    it("throws when meeting id is missing", async () => {
      await expect(MeetingService.startMeeting("u-1", undefined)).rejects.toMatchObject<Partial<CustomError>>({
        message: ErrorMessages.MEETING_ID_MUST_BE_PROVIDED,
        statusCode: 404,
      });
    });

    it("sets meeting status to LIVE", async () => {
      jest.spyOn(MeetingService, "checkHost").mockResolvedValue(undefined);
      (prisma.meeting.update as jest.Mock).mockResolvedValue({ id: "m-1", status: "LIVE" });

      const result = await MeetingService.startMeeting("u-host", "m-1");

      expect(prisma.meeting.update).toHaveBeenCalledWith({
        where: { id: "m-1" },
        data: { status: "LIVE" },
      });
      expect(result).toEqual({ id: "m-1", status: "LIVE" });
    });
  });

  describe("endMeeting", () => {
    it("throws when meeting id is missing", async () => {
      await expect(MeetingService.endMeeting("u-1", undefined)).rejects.toMatchObject<Partial<CustomError>>({
        message: ErrorMessages.MEETING_ID_MUST_BE_PROVIDED,
        statusCode: 404,
      });
    });

    it("sets meeting status to ENDED", async () => {
      jest.spyOn(MeetingService, "checkHost").mockResolvedValue(undefined);
      (prisma.meeting.update as jest.Mock).mockResolvedValue({ id: "m-1", status: "ENDED" });

      const result = await MeetingService.endMeeting("u-host", "m-1");

      expect(prisma.meeting.update).toHaveBeenCalledWith({
        where: { id: "m-1" },
        data: { status: "ENDED" },
      });
      expect(result).toEqual({ id: "m-1", status: "ENDED" });
    });
  });

  describe("addParticipant", () => {
    it("throws when meeting id is missing", async () => {
      await expect(MeetingService.addParticipant("u-host", undefined, "u-new")).rejects.toMatchObject<
        Partial<CustomError>
      >({
        message: ErrorMessages.MEETING_ID_MUST_BE_PROVIDED,
        statusCode: 404,
      });
    });

    it("throws when user already in meeting", async () => {
      jest.spyOn(MeetingService, "checkHost").mockResolvedValue(undefined);
      (MeetingModel.findParticipant as jest.Mock).mockResolvedValue({ role: "PARTICIPANT" });

      await expect(MeetingService.addParticipant("u-host", "m-1", "u-existing")).rejects.toMatchObject<
        Partial<CustomError>
      >({
        message: ErrorMessages.USER_ALREADY_IN_MEETING,
        statusCode: 400,
      });
    });

    it("adds new participant", async () => {
      jest.spyOn(MeetingService, "checkHost").mockResolvedValue(undefined);
      (MeetingModel.findParticipant as jest.Mock).mockResolvedValue(null);
      (MeetingModel.addParticipant as jest.Mock).mockResolvedValue({});

      const result = await MeetingService.addParticipant("u-host", "m-1", "u-new");

      expect(MeetingModel.addParticipant).toHaveBeenCalledWith({ userId: "u-new", meetingId: "m-1" });
      expect(result).toEqual({});
    });
  });

  describe("removeParticipant", () => {
    it("throws when user id is missing", async () => {
      jest.spyOn(MeetingService, "checkHost").mockResolvedValue(undefined);

      await expect(MeetingService.removeParticipant("u-host", "m-1", undefined)).rejects.toMatchObject<
        Partial<CustomError>
      >({
        message: ErrorMessages.USER_ID_MUST_BE_PROVIDED,
        statusCode: 404,
      });
    });

    it("throws when participant not found", async () => {
      jest.spyOn(MeetingService, "checkHost").mockResolvedValue(undefined);
      (MeetingModel.findParticipant as jest.Mock).mockResolvedValue(null);

      await expect(MeetingService.removeParticipant("u-host", "m-1", "u-not-found")).rejects.toMatchObject<
        Partial<CustomError>
      >({
        message: ErrorMessages.PARTICIPANT_NOT_FOUND,
        statusCode: 400,
      });
    });

    it("removes participant", async () => {
      jest.spyOn(MeetingService, "checkHost").mockResolvedValue(undefined);
      (MeetingModel.findParticipant as jest.Mock).mockResolvedValue({ role: "PARTICIPANT" });
      (MeetingModel.removeParticipant as jest.Mock).mockResolvedValue({});

      const result = await MeetingService.removeParticipant("u-host", "m-1", "u-remove");

      expect(MeetingModel.removeParticipant).toHaveBeenCalledWith("u-remove", "m-1");
      expect(result).toEqual({});
    });
  });
});
