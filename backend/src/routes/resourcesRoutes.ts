import express from "express";
import * as resourcesController from "../controllers/resourcesController";
import * as authController from "../controllers/authController";
import checkCourseExists from "../middlewares/checkCourseExists";
import verifyCourseMember from "../middlewares/verifyCourseMember";
import { Role } from "@prisma/client";

const router = express.Router({ mergeParams: true });

router.get("/", authController.protect, checkCourseExists, verifyCourseMember, resourcesController.getResources);

router.get("/:id", authController.protect, checkCourseExists, verifyCourseMember, resourcesController.getResourceById);

router.post(
  "/upload",
  authController.protect,
  authController.restrict(Role.INSTRUCTOR),
  checkCourseExists,
  verifyCourseMember,
  resourcesController.uploadToS3(),
  resourcesController.uploadResource,
);

router.get(
  "/:id/download",
  authController.protect,
  checkCourseExists,
  verifyCourseMember,
  resourcesController.downloadResource,
);

router.delete(
  "/:id/delete",
  authController.protect,
  authController.restrict(Role.INSTRUCTOR),
  checkCourseExists,
  verifyCourseMember,
  resourcesController.deleteResource,
);

export default router;
