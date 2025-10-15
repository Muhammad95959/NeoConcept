import express from "express";
import * as postsController from "../controllers/postsController";
import * as authController from "../controllers/authController";
import checkCourseExists from "../middlewares/checkCourseExists";
import verifyCourseMember from "../middlewares/verifyCourseMember";
import { Role } from "@prisma/client";

const router = express.Router({ mergeParams: true });

router.get("/", authController.protect, checkCourseExists, verifyCourseMember, postsController.getPosts);

router.get("/:id", authController.protect, checkCourseExists, verifyCourseMember, postsController.getPostById);

router.post(
  "/create",
  authController.protect,
  authController.restrict(Role.INSTRUCTOR),
  checkCourseExists,
  verifyCourseMember,
  postsController.createPost,
);

router.patch(
  "/:id/update",
  authController.protect,
  authController.restrict(Role.INSTRUCTOR),
  checkCourseExists,
  verifyCourseMember,
  postsController.updatePost,
);

router.delete(
  "/:id/delete",
  authController.protect,
  authController.restrict(Role.INSTRUCTOR),
  checkCourseExists,
  verifyCourseMember,
  postsController.deletePost,
);

export default router;
