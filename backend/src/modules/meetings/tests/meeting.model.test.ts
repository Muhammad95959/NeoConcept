import prisma from "../../../config/db";
import { MeetingModel } from "../meeting.model";

jest.mock("../../../config/db", () => ({
  __esModule: true,
  default: {
    meeting: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    participant: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe("MeetingModel", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should create a meeting and add host as participant", async () => {
      const meetingData = { id: "m-1", hostId: "u-1", title: "Team Meeting", channelName: "meeting-1" };
      (prisma.meeting.create as jest.Mock).mockResolvedValue(meetingData);
      (prisma.participant.create as jest.Mock).mockResolvedValue({ userId: "u-1", meetingId: "m-1", role: "HOST" });

      const result = await MeetingModel.create({
        title: "Team Meeting",
        hostId: "u-1",
        courseId: "c-1",
        channelName: "meeting-1",
      });

      expect(prisma.meeting.create).toHaveBeenCalledWith({
        data: { title: "Team Meeting", hostId: "u-1", courseId: "c-1", channelName: "meeting-1", scheduledAt: null },
      });
      expect(prisma.participant.create).toHaveBeenCalledWith({
        data: { userId: "u-1", role: "HOST", meetingId: "m-1" },
      });
      expect(result).toEqual(meetingData);
    });

    it("should handle scheduled meetings", async () => {
      const date = new Date("2025-12-25T10:00:00Z");
      const meetingData = { id: "m-2", hostId: "u-2", title: "Scheduled", channelName: "meeting-2", scheduledAt: date };
      (prisma.meeting.create as jest.Mock).mockResolvedValue(meetingData);
      (prisma.participant.create as jest.Mock).mockResolvedValue({});

      await MeetingModel.create({
        title: "Scheduled",
        hostId: "u-2",
        courseId: "c-1",
        channelName: "meeting-2",
        scheduledAt: date,
      });

      expect(prisma.meeting.create).toHaveBeenCalledWith({
        data: { title: "Scheduled", hostId: "u-2", courseId: "c-1", channelName: "meeting-2", scheduledAt: date },
      });
    });
  });

  describe("findById", () => {
    it("should find meeting by id with relations", async () => {
      const meeting = { id: "m-1", title: "Meeting 1", host: { id: "u-1" }, participants: [] };
      (prisma.meeting.findUnique as jest.Mock).mockResolvedValue(meeting);

      const result = await MeetingModel.findById("m-1");

      expect(prisma.meeting.findUnique).toHaveBeenCalledWith({
        where: { id: "m-1" },
        include: { host: true, participants: true },
      });
      expect(result).toEqual(meeting);
    });
  });

  describe("findAllByUser", () => {
    it("should find all meetings for a user", async () => {
      const meetings = [
        { id: "m-1", title: "Hosted", participants: [] },
        { id: "m-2", title: "Invited", participants: [{ userId: "u-1" }] },
      ];
      (prisma.meeting.findMany as jest.Mock).mockResolvedValue(meetings);

      const result = await MeetingModel.findAllByUser("u-1");

      expect(prisma.meeting.findMany).toHaveBeenCalledWith({
        where: {
          OR: [{ hostId: "u-1" }, { participants: { some: { userId: "u-1" } } }],
        },
        include: { participants: true },
        orderBy: { scheduledAt: "asc" },
      });
      expect(result).toEqual(meetings);
    });
  });

  describe("update", () => {
    it("should update meeting", async () => {
      const updated = { id: "m-1", title: "Updated Title" };
      (prisma.meeting.update as jest.Mock).mockResolvedValue(updated);

      const result = await MeetingModel.update("m-1", { title: "Updated Title" });

      expect(prisma.meeting.update).toHaveBeenCalledWith({
        where: { id: "m-1" },
        data: { title: "Updated Title" },
      });
      expect(result).toEqual(updated);
    });

    it("should update meeting status", async () => {
      const updated = { id: "m-1", status: "LIVE" };
      (prisma.meeting.update as jest.Mock).mockResolvedValue(updated);

      await MeetingModel.update("m-1", { status: "LIVE" });

      expect(prisma.meeting.update).toHaveBeenCalledWith({
        where: { id: "m-1" },
        data: { status: "LIVE" },
      });
    });
  });

  describe("delete", () => {
    it("should delete meeting", async () => {
      (prisma.meeting.delete as jest.Mock).mockResolvedValue({ id: "m-1" });

      await MeetingModel.delete("m-1");

      expect(prisma.meeting.delete).toHaveBeenCalledWith({
        where: { id: "m-1" },
      });
    });
  });

  describe("addParticipant", () => {
    it("should add participant with default role", async () => {
      (prisma.participant.create as jest.Mock).mockResolvedValue({
        userId: "u-2",
        meetingId: "m-1",
        role: "PARTICIPANT",
      });

      await MeetingModel.addParticipant({ userId: "u-2", meetingId: "m-1" });

      expect(prisma.participant.create).toHaveBeenCalledWith({
        data: { userId: "u-2", meetingId: "m-1", role: "PARTICIPANT" },
      });
    });

    it("should add participant with custom role", async () => {
      (prisma.participant.create as jest.Mock).mockResolvedValue({
        userId: "u-2",
        meetingId: "m-1",
        role: "HOST",
      });

      await MeetingModel.addParticipant({
        userId: "u-2",
        meetingId: "m-1",
        role: "HOST",
      });

      expect(prisma.participant.create).toHaveBeenCalledWith({
        data: { userId: "u-2", meetingId: "m-1", role: "HOST" },
      });
    });
  });

  describe("findParticipant", () => {
    it("should find participant by userId and meetingId", async () => {
      const participant = { userId: "u-1", meetingId: "m-1", role: "PARTICIPANT" };
      (prisma.participant.findUnique as jest.Mock).mockResolvedValue(participant);

      const result = await MeetingModel.findParticipant("u-1", "m-1");

      expect(prisma.participant.findUnique).toHaveBeenCalledWith({
        where: { userId_meetingId: { userId: "u-1", meetingId: "m-1" } },
      });
      expect(result).toEqual(participant);
    });
  });

  describe("removeParticipant", () => {
    it("should remove participant from meeting", async () => {
      (prisma.participant.delete as jest.Mock).mockResolvedValue({
        userId: "u-1",
        meetingId: "m-1",
      });

      await MeetingModel.removeParticipant("u-1", "m-1");

      expect(prisma.participant.delete).toHaveBeenCalledWith({
        where: { userId_meetingId: { userId: "u-1", meetingId: "m-1" } },
      });
    });
  });
});
