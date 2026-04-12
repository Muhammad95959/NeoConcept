import { Role } from "../../generated/prisma/client";
import express from "express";
import checkCourseExists from "../../middlewares/checkCourseExists";
import verifyCourseMember from "../../middlewares/verifyCourseMember";
import verifyPostOwner from "../../middlewares/verifyPostOwner";
import { validate } from "../../middlewares/validate";
import { protect } from "../../middlewares/protect";
import { PostValidationSchemas } from "./post.validation";
import { PostsController } from "./post.controller";
import { restrict } from "../../middlewares/restrict";

const router = express.Router({ mergeParams: true });

router.get(
  "/",
  protect,
  validate({ params: PostValidationSchemas.courseIdParam, query: PostValidationSchemas.getPostsQuery }),
  checkCourseExists,
  verifyCourseMember,
  PostsController.getPosts,
);

router.get(
  "/:id",
  protect,
  validate({ params: PostValidationSchemas.postIdParam }),
  checkCourseExists,
  verifyCourseMember,
  PostsController.getPost,
);

router.post(
  "/",
  protect,
  restrict(Role.INSTRUCTOR, Role.ASSISTANT),
  validate({ params: PostValidationSchemas.courseIdParam, body: PostValidationSchemas.create }),
  checkCourseExists,
  verifyCourseMember,
  PostsController.create,
);

router.patch(
  "/:id",
  protect,
  restrict(Role.INSTRUCTOR, Role.ASSISTANT),
  validate({ params: PostValidationSchemas.postIdParam, body: PostValidationSchemas.update }),
  checkCourseExists,
  verifyCourseMember,
  verifyPostOwner,
  PostsController.update,
);

router.delete(
  "/:id",
  protect,
  restrict(Role.INSTRUCTOR, Role.ASSISTANT),
  validate({ params: PostValidationSchemas.postIdParam }),
  checkCourseExists,
  verifyCourseMember,
  verifyPostOwner,
  PostsController.delete,
);

export default router;
