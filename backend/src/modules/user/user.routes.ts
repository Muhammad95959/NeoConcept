import express from "express";
import * as authController from "../auth/auth.controller";
import * as usersController from "./user.controller";
import verifyCurrentTrack from "../../middlewares/verifyCurrentTrack";

const router = express.Router();

router.patch("/", authController.protect, usersController.updateUser);

router.delete("/", authController.protect, usersController.deleteUser);

router.get("/tracks", authController.protect, usersController.getUserTracks);

router.patch("/select-track", authController.protect, verifyCurrentTrack, usersController.selectTrack);

router.patch("/quit-track", authController.protect, usersController.quitTrack);

router.get("/courses", authController.protect, usersController.getUserCourses);

router.patch("/join-course", authController.protect, usersController.joinCourse);

router.patch("/quit-course", authController.protect, usersController.quitCourse);

router.get("/requests", authController.protect, usersController.getUserRequests);

export default router;
