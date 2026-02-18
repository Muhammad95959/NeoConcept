import express from "express";
import { Role } from "../../generated/prisma";
import * as authController from "../auth/auth.controller";
import * as staffRequestsController from "./staffRequests.controller";

const router = express.Router();

router.get("/", authController.protect, authController.restrict(Role.ADMIN), staffRequestsController.getStaffRequests);

router.get(
  "/:id",
  authController.protect,
  authController.restrict(Role.ADMIN),
  staffRequestsController.getStaffRequestById,
);

router.post(
  "/",
  authController.protect,
  authController.restrict(Role.INSTRUCTOR, Role.ASSISTANT),
  staffRequestsController.createStaffRequest,
);

router.patch(
  "/:id",
  authController.protect,
  authController.restrict(Role.INSTRUCTOR, Role.ASSISTANT),
  staffRequestsController.updateStaffRequest,
);

router.patch(
  "/:id/answer",
  authController.protect,
  authController.restrict(Role.ADMIN),
  staffRequestsController.answerStaffRequest,
);

router.delete(
  "/:id",
  authController.protect,
  authController.restrict(Role.INSTRUCTOR, Role.ASSISTANT),
  staffRequestsController.deleteStaffRequest,
);

export default router;
