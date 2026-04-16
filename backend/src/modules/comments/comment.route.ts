import express from "express";
import { protect } from "../../middlewares/protect";
import checkCourseExists from "../../middlewares/checkCourseExists";
import verifyCourseMember from "../../middlewares/verifyCourseMember";
import { CommentController } from "./comment.controller";
import { validate } from "../../middlewares/validate";
import { CommentValidationSchemas } from "./comment.validation";

const router = express.Router({ mergeParams: true });

router.get(
  "/",
  protect,
  validate({ params: CommentValidationSchemas.coursePostParams }),
  checkCourseExists,
  verifyCourseMember,
  CommentController.getMany,
);

router.get(
  "/:id",
  protect,
  validate({ params: CommentValidationSchemas.idParams }),
  checkCourseExists,
  verifyCourseMember,
  CommentController.get,
);

router.post(
  "/",
  protect,
  validate({ params: CommentValidationSchemas.coursePostParams, body: CommentValidationSchemas.contentBody }),
  checkCourseExists,
  verifyCourseMember,
  CommentController.create,
);

router.patch(
  "/:id",
  protect,
  validate({ params: CommentValidationSchemas.idParams, body: CommentValidationSchemas.contentBody }),
  checkCourseExists,
  verifyCourseMember,
  CommentController.update,
);

router.delete(
  "/:id",
  protect,
  validate({ params: CommentValidationSchemas.idParams }),
  checkCourseExists,
  verifyCourseMember,
  CommentController.delete,
);

export default router;
