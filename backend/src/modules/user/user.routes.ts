import express from "express";
import verifyCurrentTrack from "../../middlewares/verifyCurrentTrack";
import { validate } from "../../middlewares/validate";
import { protect } from "../../middlewares/protect";
import { UserController } from "./user.controller";
import { UserValidationSchemas } from "./user.validation";

const router = express.Router();

router.patch("/", protect, validate({ body: UserValidationSchemas.updateUser }), UserController.updateUser);

router.delete("/", protect, UserController.deleteUser);

router.get("/tracks", protect, UserController.getUserTracks);

router.patch(
  "/select-track",
  protect,
  validate({ body: UserValidationSchemas.trackIdBody }),
  verifyCurrentTrack,
  UserController.selectTrack,
);

router.patch("/quit-track", protect, validate({ body: UserValidationSchemas.trackIdBody }), UserController.quitTrack);

router.get("/courses", protect, UserController.getUserCourses);

router.patch(
  "/join-course",
  protect,
  validate({ body: UserValidationSchemas.courseIdBody }),
  UserController.joinCourse,
);

router.patch(
  "/quit-course",
  protect,
  validate({ body: UserValidationSchemas.courseIdBody }),
  UserController.quitCourse,
);

router.get(
  "/staff-requests",
  protect,
  validate({ body: UserValidationSchemas.getUserStaffRequests }),
  UserController.getUserStaffRequests,
);

router.get(
  "/student-requests",
  protect,
  validate({ body: UserValidationSchemas.getUserStudentRequests }),
  UserController.getUserStudentRequests,
);

export default router;
