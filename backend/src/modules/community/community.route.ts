import express from "express";
import { CommunityController } from "./community.controller";
import { validate } from "../../middlewares/validate";
import { CommunityValidationSchemas } from "./community.validation";
import verifyCourseMember from "../../middlewares/verifyCourseMember";
import checkCourseExists from "../../middlewares/checkCourseExists";
import { protect } from "../../middlewares/protect";

const router = express.Router({ mergeParams: true });

router.get(
  "/",
  protect,
  validate({
    params: CommunityValidationSchemas.courseIdParams,
    query: CommunityValidationSchemas.getManyQuery,
  }),
  checkCourseExists,
  verifyCourseMember,
  CommunityController.getMany,
);

router.get(
  "/:messageId",
  protect,
  validate({ params: CommunityValidationSchemas.idParams }),
  checkCourseExists,
  verifyCourseMember,
  CommunityController.get,
);

router.post(
  "/",
  protect,
  validate({ params: CommunityValidationSchemas.courseIdParams, body: CommunityValidationSchemas.messageBody }),
  checkCourseExists,
  verifyCourseMember,
  CommunityController.create,
);

router.patch(
  "/:messageId",
  protect,
  validate({ params: CommunityValidationSchemas.courseIdParams, body: CommunityValidationSchemas.messageBody }),
  checkCourseExists,
  verifyCourseMember,
  CommunityController.update,
);

router.delete(
  "/:messageId",
  protect,
  validate({ params: CommunityValidationSchemas.idParams }),
  checkCourseExists,
  verifyCourseMember,
  CommunityController.delete,
);

export default router;
