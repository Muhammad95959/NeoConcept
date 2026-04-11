import { Router } from "express";
import MeetingController from "./meeting.controller";
import { protect } from "../../middlewares/protect";
import { validate } from "../../middlewares/validate";
import { createMeetingSchema, meetingIdParamSchema, idParamSchema, updateMeetingSchema } from "./meeting.validation";

const router = Router();

router.get("/", protect, MeetingController.getAllUser);
router.get("/:id", protect, validate({ params: idParamSchema }), MeetingController.getOne);
router.post("/", protect, validate({ body: createMeetingSchema }), MeetingController.create);
router.put("/:id", protect, validate({ body: updateMeetingSchema, params: idParamSchema }), MeetingController.update);
router.delete("/:id", protect, validate({ params: idParamSchema }), MeetingController.delete);
router.post("/:meetingId/join", protect, validate({ params: meetingIdParamSchema }), MeetingController.join);
router.post("/:meetingId/leave", protect, validate({ params: meetingIdParamSchema }), MeetingController.leave);

router.post("/:meetingId/start", protect, MeetingController.startMeeting);

router.get("/:meetingId/checkHost", protect, MeetingController.checkHost);
export default router;
