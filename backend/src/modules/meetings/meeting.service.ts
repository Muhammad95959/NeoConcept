import crypto from "crypto";
import prisma from "../../config/db";
import CustomError from "../../types/customError";
import { HTTPStatusText } from "../../types/HTTPStatusText";
import { MeetingModel } from "./meeting.model";
import { createCalendarEvent } from "../../utils/googleCalendar";
import { stringToUid } from "../../utils/stringToUid";
import { generateAgoraToken } from "../../utils/agoraToken";
import { ErrorMessages } from "../../types/errorsMessages";

export class MeetingService {
  static async create(
    userId: string,
    courseId: string,
    data: { title: string; channelName?: string; scheduledAt?: string | Date },
  ) {
    const channelName = data.channelName ?? crypto.randomUUID();
    const scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null;

    const meeting = await MeetingModel.create({
      title: data.title,
      hostId: userId,
      courseId,
      channelName,
      scheduledAt,
    });

    let calendarEvent = null;

    if (scheduledAt) {
      const startDate = new Date(scheduledAt);
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

  static async getById(id: string | string[] | undefined, courseId: string) {
    id = Array.isArray(id) ? id[0] : id;
    const meeting = await MeetingModel.findByIdAndCourseId(id!, courseId);
    if (!meeting) {
      throw new CustomError(ErrorMessages.MEETING_NOT_FOUND, 404, HTTPStatusText.FAIL);
    }
    return meeting;
  }

  static async getMeetingsByCourse(courseId: string) {
    return MeetingModel.findAllByCourse(courseId);
  }

  static async update(userId: string, meetingId: string | string[] | undefined, data: any) {
    const id = Array.isArray(meetingId) ? meetingId[0] : meetingId;
    await this.checkHost(userId, id!);
    return MeetingModel.update(id!, data);
  }

  static async delete(userId: string, meetingId: string | string[] | undefined) {
    const id = Array.isArray(meetingId) ? meetingId[0] : meetingId;
    await this.checkHost(userId, id!);
    return MeetingModel.delete(id!);
  }

  static async joinMeeting(userId: string, meetingId: string | string[] | undefined) {
    const id = Array.isArray(meetingId) ? meetingId[0] : meetingId;
    const meeting = await MeetingModel.findById(id!);
    if (!meeting) throw new CustomError(ErrorMessages.MEETING_NOT_FOUND, 404, HTTPStatusText.FAIL);

    if (meeting.status === "ENDED") throw new CustomError(ErrorMessages.MEETING_ENDED, 400, HTTPStatusText.FAIL);

    if (meeting.status === "SCHEDULED")
      throw new CustomError(ErrorMessages.MEETING_NOT_STARTED, 400, HTTPStatusText.FAIL);
    const existing = await MeetingModel.findParticipant(userId, id!);
    if (existing) throw new CustomError(ErrorMessages.USER_ALREADY_IN_MEETING, 400, HTTPStatusText.FAIL);

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

  static async leaveMeeting(userId: string, meetingId: string | string[] | undefined) {
    const id = Array.isArray(meetingId) ? meetingId[0] : meetingId;
    const participant = await MeetingModel.findParticipant(userId, id!);

    if (!participant) {
      throw new CustomError(ErrorMessages.PARTICIPANT_NOT_FOUND, 400, HTTPStatusText.FAIL);
    }

    if (participant.role === "HOST") {
      throw new CustomError(ErrorMessages.HOST_CANNOT_LEAVE_MEETING, 400, HTTPStatusText.FAIL);
    }

    return MeetingModel.removeParticipant(userId, id!);
  }

  static async checkHost(userId: string, meetingId: string | string[] | undefined) {
    const id = Array.isArray(meetingId) ? meetingId[0] : meetingId;
    const meeting = await MeetingModel.findById(id!);
    if (!meeting) {
      throw new CustomError(ErrorMessages.MEETING_NOT_FOUND, 404, HTTPStatusText.FAIL);
    }
    if (meeting.hostId === userId) {
      return;
    }
    const participant = await MeetingModel.findParticipant(userId, id!);
    if (!participant || participant.role !== "HOST") {
      throw new CustomError(ErrorMessages.ONLY_HOST_CAN_PERFORM_THIS_ACTION, 403, HTTPStatusText.FAIL);
    }
  }

  static async checkParticipant(userId: string, meetingId: string | string[] | undefined) {
    if (!meetingId) {
      throw new CustomError(ErrorMessages.MEETING_ID_MUST_BE_PROVIDED, 404, HTTPStatusText.FAIL);
    }

    const id = Array.isArray(meetingId) ? meetingId[0] : meetingId;
    const participant = await MeetingModel.findParticipant(userId, id);

    if (!participant) {
      throw new CustomError(ErrorMessages.PARTICIPANT_NOT_FOUND, 403, HTTPStatusText.FAIL);
    }
  }

  static async startMeeting(userId: string, meetingId: string | string[] | undefined) {
    if (!meetingId) {
      throw new CustomError(ErrorMessages.MEETING_ID_MUST_BE_PROVIDED, 404, HTTPStatusText.FAIL);
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
      throw new CustomError(ErrorMessages.MEETING_ID_MUST_BE_PROVIDED, 404, HTTPStatusText.FAIL);
    }

    const id = Array.isArray(meetingId) ? meetingId[0] : meetingId;
    await this.checkHost(userId, id);

    return prisma.meeting.update({
      where: { id },
      data: { status: "ENDED" },
    });
  }

  static async removeParticipant(
    hostId: string,
    meetingId: string | string[] | undefined,
    userId: string | string[] | undefined,
  ) {
    const id = Array.isArray(meetingId) ? meetingId[0] : meetingId;
    await this.checkHost(hostId, id!);
    if (!userId) {
      throw new CustomError(ErrorMessages.USER_ID_MUST_BE_PROVIDED, 404, HTTPStatusText.FAIL);
    }
    const checkedUserId = Array.isArray(userId) ? userId[0] : userId;
    const participant = await MeetingModel.findParticipant(checkedUserId!, id!);
    if (!participant) {
      throw new CustomError(ErrorMessages.PARTICIPANT_NOT_FOUND, 400, HTTPStatusText.FAIL);
    }

    return MeetingModel.removeParticipant(checkedUserId!, id!);
  }
}
