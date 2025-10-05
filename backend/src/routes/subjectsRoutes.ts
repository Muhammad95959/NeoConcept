import express from "express";
import * as subjectsController from "../controllers/subjectsController";
import * as authController from "../controllers/authController";
import { Role } from "@prisma/client";

const router = express.Router();

router.get("/get-rooms", subjectsController.getRooms);

router.get("/get-room/:id", subjectsController.getRoomById);

router.post(
  "/create-room",
  authController.protect,
  authController.restrict(Role.INSTRUCTOR),
  subjectsController.createRoom,
);

router.patch(
  "/update-room/:id",
  authController.protect,
  authController.restrict(Role.INSTRUCTOR),
  subjectsController.updateRoom,
);

router.delete(
  "/delete-room/:id",
  authController.protect,
  authController.restrict(Role.INSTRUCTOR),
  subjectsController.deleteRoom,
);

export default router;
