import { Role } from "@prisma/client";
import express from "express";
import * as authController from "../auth/auth.controller";
import * as postsController from "./posts.controller";
import checkCourseExists from "../../middlewares/checkCourseExists";
import verifyCourseMember from "../../middlewares/verifyCourseMember";

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
