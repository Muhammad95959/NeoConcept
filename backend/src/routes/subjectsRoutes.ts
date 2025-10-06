import express from "express";
import * as subjectsController from "../controllers/subjectsController";
import * as authController from "../controllers/authController";
import { Role } from "@prisma/client";

const router = express.Router();

router.get("/", subjectsController.getRooms);

router.get("/:id", subjectsController.getRoomById);

router.post(
  "/create",
  authController.protect,
  authController.restrict(Role.INSTRUCTOR),
  subjectsController.createRoom,
);

router.patch(
  "/:id/update",
  authController.protect,
  authController.restrict(Role.INSTRUCTOR),
  subjectsController.updateRoom,
);

router.delete(
  "/:id/delete",
  authController.protect,
  authController.restrict(Role.INSTRUCTOR),
  subjectsController.deleteRoom,
);

export default router;
