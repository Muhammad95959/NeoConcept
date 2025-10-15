import express from "express";
import * as coursesController from "../controllers/coursesController";
import * as authController from "../controllers/authController";
import { Role } from "@prisma/client";

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
