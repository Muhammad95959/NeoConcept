import { Router } from "express";
import MeetingController from "./meeting.controller";
import { protect } from "../../middlewares/protect";
import { validate } from "../../middlewares/validate";
import { MeetingValidationSchemas } from "./meeting.validation";
import { restrict } from "../../middlewares/restrict";
import { Role } from "../../generated/prisma";
import checkCourseExists from "../../middlewares/checkCourseExists";
import verifyCourseMember from "../../middlewares/verifyCourseMember";

const router = Router({ mergeParams: true });

router.get(
  "/",
  protect,
  restrict(Role.INSTRUCTOR, Role.INSTRUCTOR),
  checkCourseExists,
  verifyCourseMember,
  MeetingController.getAllUser,
);

router.get(
  "/:id",
  protect,
  restrict(Role.INSTRUCTOR, Role.INSTRUCTOR),
  validate({ params: MeetingValidationSchemas.idParams }),
  checkCourseExists,
  verifyCourseMember,
  MeetingController.getOne,
);

router.post(
  "/",
  protect,
  restrict(Role.INSTRUCTOR, Role.INSTRUCTOR),
  validate({ params: MeetingValidationSchemas.courseIdParams, body: MeetingValidationSchemas.createBody }),
  checkCourseExists,
  verifyCourseMember,
  MeetingController.create,
);

router.put(
  "/:id",
  protect,
  restrict(Role.INSTRUCTOR, Role.INSTRUCTOR),
  validate({ body: MeetingValidationSchemas.updateBody, params: MeetingValidationSchemas.idParams }),
  checkCourseExists,
  verifyCourseMember,
  MeetingController.update,
);

router.delete(
  "/:id",
  protect,
  restrict(Role.INSTRUCTOR, Role.INSTRUCTOR),
  validate({ params: MeetingValidationSchemas.idParams }),
  checkCourseExists,
  verifyCourseMember,
  MeetingController.delete,
);

router.post(
  "/:meetingId/join",
  protect,
  validate({ params: MeetingValidationSchemas.meetingIdParams }),
  checkCourseExists,
  verifyCourseMember,
  MeetingController.join,
);

router.post(
  "/:meetingId/leave",
  protect,
  validate({ params: MeetingValidationSchemas.meetingIdParams }),
  checkCourseExists,
  verifyCourseMember,
  MeetingController.leave,
);

router.post(
  "/:meetingId/start",
  protect,
  restrict(Role.INSTRUCTOR, Role.INSTRUCTOR),
  validate({ params: MeetingValidationSchemas.meetingIdParams }),
  checkCourseExists,
  verifyCourseMember,
  MeetingController.startMeeting,
);

router.get(
  "/:meetingId/checkHost",
  protect,
  validate({ params: MeetingValidationSchemas.meetingIdParams }),
  checkCourseExists,
  verifyCourseMember,
  MeetingController.checkHost,
);

export default router;
