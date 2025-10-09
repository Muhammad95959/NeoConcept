import express from "express";
import * as postsController from "../controllers/postsController";
import * as authController from "../controllers/authController";
import checkSubjectRoomExists from "../middlewares/checkSubjectRoomExists";
import { Role } from "@prisma/client";

const router = express.Router({ mergeParams: true });

router.get("/", checkSubjectRoomExists, postsController.getPosts);

router.get("/:id", checkSubjectRoomExists, postsController.getPostById);

router.post(
  "/create",
  authController.protect,
  authController.restrict(Role.INSTRUCTOR),
  checkSubjectRoomExists,
  postsController.createPost,
);

router.patch(
  "/:id/update",
  authController.protect,
  authController.restrict(Role.INSTRUCTOR),
  checkSubjectRoomExists,
  postsController.updatePost,
);

router.delete(
  "/:id/delete",
  authController.protect,
  authController.restrict(Role.INSTRUCTOR),
  checkSubjectRoomExists,
  postsController.deletePost,
);

export default router;

// TODO: make sure the request is coming from someone who is from the subject room
