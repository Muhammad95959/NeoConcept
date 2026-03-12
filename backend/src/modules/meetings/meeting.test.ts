import request from "supertest";
import app from "../../app";
import { MeetingModel } from "./meeting.model";

jest.mock("./meeting.model");

const mockedMeetingModel = MeetingModel as jest.Mocked<typeof MeetingModel>;
const apiPrefix = "/api/v1";
const validUuid = "00000000-0000-4000-8000-000000000001";

jest.mock("../../middlewares/protect", () => ({
  protect: (req: any, res: any, next: any) => {
    res.locals.user = { id: "user123" };
    next();
  },
}));

describe("Meeting Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /meetings", () => {
    it("should return all user meetings", async () => {
      mockedMeetingModel.findAllByUser.mockResolvedValue([
        { id: "1", title: "Meeting 1" },
        { id: "2", title: "Meeting 2" },
      ] as any);

      const res = await request(app).get(`${apiPrefix}/meetings`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(mockedMeetingModel.findAllByUser).toHaveBeenCalledWith("user123");
    });
  });

  describe("GET /meetings/:id", () => {
    it("should return a single meeting", async () => {
      mockedMeetingModel.findById.mockResolvedValue({
        id: "1",
        title: "Meeting 1",
      } as any);

      const res = await request(app).get(`${apiPrefix}/meetings/${validUuid}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe("1");
      expect(mockedMeetingModel.findById).toHaveBeenCalledWith(validUuid);
    });

    it("should return 404 if meeting not found", async () => {
      mockedMeetingModel.findById.mockResolvedValue(null as any);

      const res = await request(app).get(`${apiPrefix}/meetings/00000000-0000-4000-8000-000000000099`);

      expect(res.status).toBe(404);
    });
  });

  describe("POST /meetings", () => {
    it("should create a meeting", async () => {
      mockedMeetingModel.create.mockResolvedValue({
        id: "1",
        title: "New Meeting",
        channelName: "channel-name",
      } as any);

      const res = await request(app)
        .post(`${apiPrefix}/meetings`)
        .send({ title: "New Meeting", channelName: "channel-name" });
      expect(res.status).toBe(201);
      expect(res.body.data.meeting.id).toBe("1");
      expect(mockedMeetingModel.create).toHaveBeenCalled();
    });
  });

  describe("PUT /meetings/:id", () => {
    it("should update a meeting if user is host", async () => {
      mockedMeetingModel.findParticipant.mockResolvedValue({
        role: "HOST",
      } as any);
      mockedMeetingModel.update.mockResolvedValue({
        id: "1",
        title: "Updated",
      } as any);

      const res = await request(app)
        .put(`${apiPrefix}/meetings/${validUuid}`)
        .send({ title: "Updated" });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe("Updated");
    });

    it("should return 403 if user is not host", async () => {
      mockedMeetingModel.findParticipant.mockResolvedValue({
        role: "PARTICIPANT",
      } as any);

      const res = await request(app)
        .put(`${apiPrefix}/meetings/${validUuid}`)
        .send({ title: "Updated" });

      expect(res.status).toBe(403);
      expect(res.body.message).toBe("Only host can perform this action");
    });
  });

  describe("DELETE /meetings/:id", () => {
    it("should delete a meeting if user is host", async () => {
      mockedMeetingModel.findParticipant.mockResolvedValue({
        role: "HOST",
      } as any);
      mockedMeetingModel.delete.mockResolvedValue({} as any);

      const res = await request(app).delete(`${apiPrefix}/meetings/${validUuid}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Deleted successfully");
    });

    it("should return 403 if user is not host", async () => {
      mockedMeetingModel.findParticipant.mockResolvedValue({
        role: "PARTICIPANT",
      } as any);
      const res = await request(app).delete(`${apiPrefix}/meetings/${validUuid}`);
      expect(res.status).toBe(403);
      expect(res.body.message).toBe("Only host can perform this action");
    });
  });
  describe("POST /meetings/:meetingId/join", () => {
    it("should join a meeting", async () => {
      mockedMeetingModel.findById.mockResolvedValue({
        id: "1",
        channelName: "ch1",
        status: "LIVE",
      } as any);
      mockedMeetingModel.findParticipant.mockResolvedValue(null as any);
      mockedMeetingModel.addParticipant.mockResolvedValue({} as any);

      const res = await request(app).post(`${apiPrefix}/meetings/${validUuid}/join`);

      expect(res.status).toBe(200);
      expect(res.body.data.token).toBeDefined();
    });

    it("should fail if already joined", async () => {
      mockedMeetingModel.findById.mockResolvedValue({
        id: "1",
        channelName: "ch1",
        status: "LIVE",
      } as any);
      mockedMeetingModel.findParticipant.mockResolvedValue({} as any);

      const res = await request(app).post(`${apiPrefix}/meetings/${validUuid}/join`);

      expect(res.status).toBe(400);
    });
  });

  describe("POST /meetings/:meetingId/leave", () => {
    it("should leave a meeting", async () => {
      mockedMeetingModel.findParticipant.mockResolvedValue({
        userId: "user123",
        role: "PARTICIPANT",
      } as any);
      mockedMeetingModel.removeParticipant.mockResolvedValue({} as any);

      const res = await request(app).post(`${apiPrefix}/meetings/${validUuid}/leave`);

      expect(res.status).toBe(200);
    });

    it("should fail if user is host", async () => {
      mockedMeetingModel.findParticipant.mockResolvedValue({
        userId: "user123",
        role: "HOST",
      } as any);

      const res = await request(app).post(`${apiPrefix}/meetings/${validUuid}/leave`);

      expect(res.status).toBe(400);
    });
  });
});
