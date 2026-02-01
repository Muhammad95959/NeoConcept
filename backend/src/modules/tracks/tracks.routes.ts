import express from "express";
import * as authController from "../auth/auth.controller";
import { Role } from "../../generated/prisma";
import * as tracksController from "./tracks.controller";

const router = express.Router();

router.get("/", tracksController.getTracks);

router.get("/:id", tracksController.getTrackById);

router.get("/:id/staff", authController.protect, authController.restrict(Role.ADMIN), tracksController.getTrackStaff);

router.post("/", authController.protect, authController.restrict(Role.ADMIN), tracksController.createTrack);

router.patch("/:id", authController.protect, authController.restrict(Role.ADMIN), tracksController.updateTrack);

router.delete("/:id", authController.protect, authController.restrict(Role.ADMIN), tracksController.deleteTrack);

export default router;
