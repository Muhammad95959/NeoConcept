import express from "express";
import { Role } from "../../generated/prisma";
import * as authController from "../auth/auth.controller";
import * as staffRequestsController from "./staffRequests.controller";
import { protect } from "../../middlewares/protect";
import { restrict } from "../../middlewares/restrict";

const router = express.Router();

router.get("/", protect, restrict(Role.ADMIN), staffRequestsController.getStaffRequests);

router.get(
  "/:id",
  protect,
  restrict(Role.ADMIN),
  staffRequestsController.getStaffRequestById,
);

router.post(
  "/",
  protect,
  restrict(Role.INSTRUCTOR, Role.ASSISTANT),
  staffRequestsController.createStaffRequest,
);

router.patch(
  "/:id",
  protect,
  restrict(Role.INSTRUCTOR, Role.ASSISTANT),
  staffRequestsController.updateStaffRequest,
);

router.patch(
  "/:id/answer",
  protect,
  restrict(Role.ADMIN),
  staffRequestsController.answerStaffRequest,
);

router.delete(
  "/:id",
  protect,
  restrict(Role.INSTRUCTOR, Role.ASSISTANT),
  staffRequestsController.deleteStaffRequest,
);

export default router;
