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
  validate({ params: MeetingValidationSchemas.courseIdParams }),
  checkCourseExists,
  verifyCourseMember,
  MeetingController.getAll,
);

router.get(
  "/:id",
  protect,
  restrict(Role.INSTRUCTOR, Role.ASSISTANT),
  validate({ params: MeetingValidationSchemas.idParams }),
  checkCourseExists,
  verifyCourseMember,
  MeetingController.getOne,
);

router.post(
  "/",
  protect,
  restrict(Role.INSTRUCTOR, Role.ASSISTANT),
  validate({ params: MeetingValidationSchemas.courseIdParams, body: MeetingValidationSchemas.createBody }),
  checkCourseExists,
  verifyCourseMember,
  MeetingController.create,
);

router.put(
  "/:id",
  protect,
  restrict(Role.INSTRUCTOR, Role.ASSISTANT),
  validate({ body: MeetingValidationSchemas.updateBody, params: MeetingValidationSchemas.idParams }),
  checkCourseExists,
  verifyCourseMember,
  MeetingController.update,
);

router.delete(
  "/:id",
  protect,
  restrict(Role.INSTRUCTOR, Role.ASSISTANT),
  validate({ params: MeetingValidationSchemas.idParams }),
  checkCourseExists,
  verifyCourseMember,
  MeetingController.delete,
);

router.post(
  "/:id/join",
  protect,
  validate({ params: MeetingValidationSchemas.idParams }),
  checkCourseExists,
  verifyCourseMember,
  MeetingController.join,
);

router.post(
  "/:id/leave",
  protect,
  validate({ params: MeetingValidationSchemas.idParams }),
  checkCourseExists,
  verifyCourseMember,
  MeetingController.leave,
);

router.post(
  "/:id/start",
  protect,
  restrict(Role.INSTRUCTOR, Role.ASSISTANT),
  validate({ params: MeetingValidationSchemas.idParams }),
  checkCourseExists,
  verifyCourseMember,
  MeetingController.startMeeting,
);

router.get(
  "/:id/checkHost",
  protect,
  validate({ params: MeetingValidationSchemas.idParams }),
  checkCourseExists,
  verifyCourseMember,
  MeetingController.checkHost,
);

router.delete(
  "/:id/remove-participant",
  protect,
  restrict(Role.INSTRUCTOR, Role.ASSISTANT),
  validate({ params: MeetingValidationSchemas.removeParticipantParams }),
  checkCourseExists,
  verifyCourseMember,
  MeetingController.removeParticipant,
);

export default router;
