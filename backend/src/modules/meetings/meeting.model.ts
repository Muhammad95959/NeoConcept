import prisma from "../../config/db";
import { MeetingStatus } from "../../generated/prisma";

export class MeetingModel {
  static findById(id: string) {
    return prisma.meeting.findUnique({
      where: { id },
      include: {
        host: true,
        participants: true,
      },
    });
  }

  static findAllByCourse(courseId: string) {
    return prisma.meeting.findMany({
      where: { courseId },
      include: {
        host: true,
        participants: true,
      },
      orderBy: { scheduledAt: "asc" },
    });
  }

  static findParticipant(userId: string, meetingId: string) {
    return prisma.participant.findUnique({
      where: {
        userId_meetingId: {
          userId,
          meetingId,
        },
      },
    });
  }

  static async create(data: { title: string; hostId: string; courseId: string; channelName: string; scheduledAt?: Date | null }) {
    const meeting = await prisma.meeting.create({
      data: {
        title: data.title,
        hostId: data.hostId,
        courseId: data.courseId,
        channelName: data.channelName,
        scheduledAt: data.scheduledAt ?? null,
      },
    });

    await prisma.participant.create({
      data: {
        userId: data.hostId,
        role: "HOST",
        meetingId: meeting.id,
      },
    });

    return meeting;
  }

  static update(
    id: string,
    data: Partial<{
      title: string;
      scheduledAt: Date;
      channelName: string;
      status: MeetingStatus;
    }>,
  ) {
    return prisma.meeting.update({
      where: { id },
      data,
    });
  }

  static addParticipant(data: { userId: string; meetingId: string; role?: "HOST" | "PARTICIPANT" }) {
    return prisma.participant.create({
      data: {
        userId: data.userId,
        meetingId: data.meetingId,
        role: data.role || "PARTICIPANT",
      },
    });
  }

  static removeParticipant(userId: string, meetingId: string) {
    return prisma.participant.delete({
      where: {
        userId_meetingId: {
          userId,
          meetingId,
        },
      },
    });
  }

  static delete(id: string) {
    return prisma.meeting.delete({
      where: { id },
    });
  }
}
