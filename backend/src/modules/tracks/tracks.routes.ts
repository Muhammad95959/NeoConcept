import express from "express";
import * as authController from "../auth/auth.controller";
import { Role } from "../../generated/prisma";
import * as tracksController from "./tracks.controller";
import { protect } from "../../middlewares/protect";

const router = express.Router();

router.get("/", tracksController.getTracks);

router.get("/:id", tracksController.getTrackById);

router.get("/:id/staff", protect, restrict(Role.ADMIN), tracksController.getTrackStaff);

router.post("/", protect, restrict(Role.ADMIN), tracksController.createTrack);

router.patch("/:id", protect, restrict(Role.ADMIN), tracksController.updateTrack);

router.delete("/:id", protect, restrict(Role.ADMIN), tracksController.deleteTrack);

export default router;
