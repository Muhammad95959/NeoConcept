import crypto from "crypto";
import prisma from "../../config/db";
import CustomError from "../../types/customError";
import { HttpStatusText } from "../../types/HTTPStatusText";
import { MeetingModel } from "./meeting.model";
import { createCalendarEvent } from "../../utils/googleCalendar";
import { stringToUid } from "../../utils/stringToUid";
import { generateAgoraToken } from "../../utils/agoraToken";

export class MeetingService {
  static async create(
    userId: string,
    data: { title: string; channelName?: string; scheduledAt?: Date },
  ) {
    const channelName = data.channelName ?? crypto.randomUUID();

    const meeting = await MeetingModel.create({
      title: data.title,
      hostId: userId,
      channelName,
      scheduledAt: data.scheduledAt ?? null,
    });

    let calendarEvent = null;

    if (data.scheduledAt) {
      const startDate = new Date(data.scheduledAt);
      const endDate = new Date(startDate);
      endDate.setHours(endDate.getHours() + 1);
      
      calendarEvent = await createCalendarEvent({
        summary: meeting.title,
        description: `Meeting ID: ${meeting.id}\nChannel: ${channelName}`,
        startDate,
        endDate,
      });
    }

    const uid = stringToUid(userId);
    const token = generateAgoraToken(channelName, uid.toString());

    return {
      meeting,
      token,
      appID: process.env.AGORA_APP_ID,
      channel: channelName,
      uid,
      calendarEvent,
    };
  }

  static async getById(id: string | string[] | undefined) {
    if (!id) {
      throw new CustomError(
        "Meeting ID must be provided",
        404,
        HttpStatusText.FAIL,
      );
    }
    const meetingId = Array.isArray(id) ? id[0] : id;
    const meeting = await MeetingModel.findById(meetingId!);
    if (!meeting) {
      throw new CustomError("Meeting not found", 404, HttpStatusText.FAIL);
    }
    return meeting;
  }

  static async getUserMeetings(userId: string) {
    return MeetingModel.findAllByUser(userId);
  }

  static async update(
    userId: string,
    meetingId: string | string[] | undefined,
    data: any,
  ) {
    if (!meetingId) {
      throw new CustomError(
        "Meeting ID must be provided",
        404,
        HttpStatusText.FAIL,
      );
    }
    const id = Array.isArray(meetingId) ? meetingId[0] : meetingId;
    await this.checkHost(userId, id!);
    return MeetingModel.update(id!, data);
  }

  static async delete(
    userId: string,
    meetingId: string | string[] | undefined,
  ) {
    if (!meetingId) {
      throw new CustomError(
        "Meeting ID must be provided",
        404,
        HttpStatusText.FAIL,
      );
    }
    const id = Array.isArray(meetingId) ? meetingId[0] : meetingId;
    await this.checkHost(userId, id!);
    return MeetingModel.delete(id!);
  }

  static async joinMeeting(
    userId: string,
    meetingId: string | string[] | undefined,
  ) {
    if (!meetingId)
      throw new CustomError(
        "Meeting ID must be provided",
        404,
        HttpStatusText.FAIL,
      );

    const id = Array.isArray(meetingId) ? meetingId[0] : meetingId;
    const meeting = await MeetingModel.findById(id!);
    if (!meeting)
      throw new CustomError("Meeting not found", 404, HttpStatusText.FAIL);

    if (meeting.status === "ENDED")
      throw new CustomError("Meeting has ended", 400, HttpStatusText.FAIL);

    if (meeting.status === "SCHEDULED")
      throw new CustomError(
        "Meeting hasn't started yet",
        400,
        HttpStatusText.FAIL,
      );
    const existing = await MeetingModel.findParticipant(userId, id!);
    if (existing) throw new CustomError("Already joined this meeting", 400);

    await MeetingModel.addParticipant({ userId, meetingId: id! });
    const uid = stringToUid(userId);
    const token = generateAgoraToken(meeting.channelName, uid.toString());

    return {
      meetingId: meeting.id,
      channel: meeting.channelName,
      uid,
      token,
      appID: process.env.AGORA_APP_ID,
    };
  }

  static async leaveMeeting(
    userId: string,
    meetingId: string | string[] | undefined,
  ) {
    if (!meetingId) {
      throw new CustomError(
        "Meeting must be provided",
        404,
        HttpStatusText.FAIL,
      );
    }
    const id = Array.isArray(meetingId) ? meetingId[0] : meetingId;
    const participant = await MeetingModel.findParticipant(userId, id!);

    if (!participant) {
      throw new CustomError(
        "You are not in this meeting",
        400,
        HttpStatusText.FAIL,
      );
    }

    if (participant.role === "HOST") {
      throw new CustomError(
        "Host cannot leave meeting. You must end it",
        400,
        HttpStatusText.FAIL,
      );
    }

    return MeetingModel.removeParticipant(userId, id!);
  }

  static async checkHost(userId: string, meetingId: string | string[] | undefined) {
    if (!meetingId) {
      throw new CustomError(
        "Meeting ID must be provided",
        404,
        HttpStatusText.FAIL,
      );
    }

    const id = Array.isArray(meetingId) ? meetingId[0] : meetingId;
    const participant = await MeetingModel.findParticipant(userId, id);
    if (!participant || participant.role !== "HOST") {
      throw new CustomError(
        "Only host can perform this action",
        403,
        HttpStatusText.FAIL,
      );
    }
  }

  static async checkParticipant(userId: string, meetingId: string | string[] | undefined) {
    if (!meetingId) {
      throw new CustomError(
        "Meeting ID must be provided",
        404,
        HttpStatusText.FAIL,
      );
    }

    const id = Array.isArray(meetingId) ? meetingId[0] : meetingId;
    const participant = await MeetingModel.findParticipant(userId, id);

    if (!participant) {
      throw new CustomError(
        "You are not part of this meeting",
        403,
        HttpStatusText.FAIL,
      );
    }
  }

  static async startMeeting(userId: string, meetingId: string | string[] | undefined) {
    if (!meetingId) {
      throw new CustomError(
        "Meeting ID must be provided",
        404,
        HttpStatusText.FAIL,
      );
    }

    const id = Array.isArray(meetingId) ? meetingId[0] : meetingId;
    await this.checkHost(userId, id);

    return prisma.meeting.update({
      where: { id },
      data: { status: "LIVE" },
    });
  }

  static async endMeeting(userId: string, meetingId: string | string[] | undefined) {
    if (!meetingId) {
      throw new CustomError(
        "Meeting ID must be provided",
        404,
        HttpStatusText.FAIL,
      );
    }

    const id = Array.isArray(meetingId) ? meetingId[0] : meetingId;
    await this.checkHost(userId, id);

    return prisma.meeting.update({
      where: { id },
      data: { status: "ENDED" },
    });
  }

  static async addParticipant(
    hostId: string,
    meetingId: string | string[] | undefined,
    userId: string,
  ) {
    if (!meetingId) {
      throw new CustomError(
        "Meeting ID must be provided",
        404,
        HttpStatusText.FAIL,
      );
    }
    const id = Array.isArray(meetingId) ? meetingId[0] : meetingId;
    await this.checkHost(hostId, id!);

    const existing = await MeetingModel.findParticipant(userId, id!);
    if (existing) {
      throw new CustomError(
        "User is already in the meeting",
        400,
        HttpStatusText.FAIL,
      );
    }

    return MeetingModel.addParticipant({ userId, meetingId: id! });
  }

  static async removeParticipant(
    hostId: string,
    meetingId: string | string[] | undefined,
    userId: string | string[] | undefined,
  ) {
    if (!meetingId) {
      throw new CustomError(
        "Meeting ID must be provided",
        404,
        HttpStatusText.FAIL,
      );
    }
    const id = Array.isArray(meetingId) ? meetingId[0] : meetingId;
    await this.checkHost(hostId, id!);
    if (!userId) {
      throw new CustomError(
        "User ID must be provided",
        404,
        HttpStatusText.FAIL,
      );
    }
    const checkedUserId = Array.isArray(userId) ? userId[0] : userId;
    const participant = await MeetingModel.findParticipant(checkedUserId!, id!);
    if (!participant) {
      throw new CustomError(
        "User is not in the meeting",
        400,
        HttpStatusText.FAIL,
      );
    }

    return MeetingModel.removeParticipant(checkedUserId!, id!);
  }
}
