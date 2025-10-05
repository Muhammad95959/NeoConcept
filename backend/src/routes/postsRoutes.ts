import express from "express";
import * as postsController from "../controllers/postsController";
import * as authController from "../controllers/authController";
import checkSubjectExists from "../middlewares/checkSubjectExists";
import { Role } from "@prisma/client";

const router = express.Router();

router.get("/get-posts/:subjectId", checkSubjectExists, postsController.getPosts);

router.get("/get-post/:subjectId/:id", checkSubjectExists, postsController.getPostById);

router.post(
  "/create-post/:subjectId",
  authController.protect,
  authController.restrict(Role.INSTRUCTOR),
  checkSubjectExists,
  postsController.createPost,
);

router.patch(
  "/update-post/:subjectId/:id",
  authController.protect,
  authController.restrict(Role.INSTRUCTOR),
  checkSubjectExists,
  postsController.updatePost,
);

router.delete(
  "/delete-post/:subjectId/:id",
  authController.protect,
  authController.restrict(Role.INSTRUCTOR),
  checkSubjectExists,
  postsController.deletePost,
);

export default router;

// TODO: these endpoints are ugly, do something like /api/v1/subjects/:subjectId/posts/:postId
