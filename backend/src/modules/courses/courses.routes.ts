import { Role } from "../../generated/prisma/client";
import express from "express";
import * as authController from "../auth/auth.controller";
import * as coursesController from "./courses.controller";

const router = express.Router();

router.get("/", coursesController.getRooms);

router.get("/:id", coursesController.getRoomById);

router.post("/create", authController.protect, authController.restrict(Role.INSTRUCTOR), coursesController.createRoom);

router.patch(
  "/:id/update",
  authController.protect,
  authController.restrict(Role.INSTRUCTOR),
  coursesController.updateRoom,
);

router.delete(
  "/:id/delete",
  authController.protect,
  authController.restrict(Role.INSTRUCTOR),
  coursesController.deleteRoom,
);

export default router;
