import express from "express";
import * as authController from "../auth/auth.controller";
import * as usersController from "./user.controller";
import verifyCurrentTrack from "../../middlewares/verifyCurrentTrack";
import { validate } from "../../middlewares/validate";
import { quitTrackSchema, selectTrackSchema, updateUserSchema } from "./user.validation";

const router = express.Router();

router.patch("/", authController.protect, validate({ body: updateUserSchema }), usersController.updateUser);

router.delete("/", authController.protect, usersController.deleteUser);

router.get("/tracks", authController.protect, usersController.getUserTracks);

router.patch(
  "/select-track",
  authController.protect,
  validate({ body: selectTrackSchema }),
  verifyCurrentTrack,
  usersController.selectTrack,
);

router.patch("/quit-track", authController.protect, validate({ body: quitTrackSchema }), usersController.quitTrack);

router.get("/courses", authController.protect, usersController.getUserCourses);

router.patch("/join-course", authController.protect, usersController.joinCourse);

router.patch("/quit-course", authController.protect, usersController.quitCourse);

router.get("/staff-requests", authController.protect, usersController.getUserStaffRequests);

router.get("/student-requests", authController.protect, usersController.getUserStudentRequests);

export default router;
