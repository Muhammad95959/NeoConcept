import express from "express";
import * as requestsController from "./requests.controller";
import * as authController from "../auth/auth.controller";
import { Role } from "../../generated/prisma";

const router = express.Router();

router.get("/", authController.protect, authController.restrict(Role.ADMIN), requestsController.getRequests);

router.get("/:id", authController.protect, authController.restrict(Role.ADMIN), requestsController.getRequestById);

router.post(
  "/",
  authController.protect,
  authController.restrict(Role.INSTRUCTOR, Role.ASSISTANT),
  requestsController.createRequest,
);

router.patch(
  "/:id",
  authController.protect,
  authController.restrict(Role.INSTRUCTOR, Role.ASSISTANT),
  requestsController.updateRequest,
);

router.patch(
  "/:id/answer",
  authController.protect,
  authController.restrict(Role.ADMIN),
  requestsController.answerRequest,
);

router.delete(
  "/:id",
  authController.protect,
  authController.restrict(Role.INSTRUCTOR, Role.ASSISTANT),
  requestsController.deleteRequest,
);

export default router;
