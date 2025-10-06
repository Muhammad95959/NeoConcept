import express from "express";
import * as postsController from "../controllers/postsController";
import * as authController from "../controllers/authController";
import checkSubjectExists from "../middlewares/checkSubjectExists";
import { Role } from "@prisma/client";

const router = express.Router({ mergeParams: true });

router.get("/", checkSubjectExists, postsController.getPosts);

router.get("/:id", checkSubjectExists, postsController.getPostById);

router.post(
  "/create",
  authController.protect,
  authController.restrict(Role.INSTRUCTOR),
  checkSubjectExists,
  postsController.createPost,
);

router.patch(
  "/:id/update",
  authController.protect,
  authController.restrict(Role.INSTRUCTOR),
  checkSubjectExists,
  postsController.updatePost,
);

router.delete(
  "/:id/delete",
  authController.protect,
  authController.restrict(Role.INSTRUCTOR),
  checkSubjectExists,
  postsController.deletePost,
);

export default router;
