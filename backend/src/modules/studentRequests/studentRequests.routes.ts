import express from "express";
import * as authController from "../auth/auth.controller";
import * as studentRequestsController from "./studentRequests.controller";
import { Role } from "../../generated/prisma";

const router = express.Router();

router.get(
  "/",
  authController.protect,
  authController.restrict(Role.INSTRUCTOR, Role.ASSISTANT),
  studentRequestsController.getCourseStudentRequests,
);

router.get(
  "/:id",
  authController.protect,
  authController.restrict(Role.INSTRUCTOR, Role.ASSISTANT),
  studentRequestsController.getCourseStudentRequestById,
);

router.post(
  "/",
  authController.protect,
  authController.restrict(Role.STUDENT),
  studentRequestsController.createStudentRequest,
);

router.patch(
  "/:id/answer",
  authController.protect,
  authController.restrict(Role.INSTRUCTOR, Role.ASSISTANT),
  studentRequestsController.answerStudentRequest,
);

router.delete(
  "/:id",
  authController.protect,
  authController.restrict(Role.STUDENT),
  studentRequestsController.deleteStudentRequest,
);

export default router;
