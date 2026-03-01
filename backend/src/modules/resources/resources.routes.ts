import { Role } from "../../generated/prisma/client";
import express from "express";
import * as authController from "../auth/auth.controller";
import * as resourcesController from "./resources.controller";
import checkCourseExists from "../../middlewares/checkCourseExists";
import verifyCourseMember from "../../middlewares/verifyCourseMember";
import { protect } from "../../middlewares/protect";
import { restrict } from "../../middlewares/restrict";

const router = express.Router({ mergeParams: true });

router.get("/", protect, checkCourseExists, verifyCourseMember, resourcesController.getResources);

router.get("/:id", protect, checkCourseExists, verifyCourseMember, resourcesController.getResourceById);

router.post(
  "/upload",
  protect,
  restrict(Role.INSTRUCTOR),
  checkCourseExists,
  verifyCourseMember,
  resourcesController.uploadToS3(),
  resourcesController.uploadResource,
);

router.get(
  "/:id/download",
  protect,
  checkCourseExists,
  verifyCourseMember,
  resourcesController.downloadResource,
);

router.delete(
  "/:id/delete",
  protect,
  restrict(Role.INSTRUCTOR),
  checkCourseExists,
  verifyCourseMember,
  resourcesController.deleteResource,
);

export default router;
