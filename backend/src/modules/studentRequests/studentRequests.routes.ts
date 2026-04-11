import express from "express";
import { Role } from "../../generated/prisma";
import { protect } from "../../middlewares/protect";
import { restrict } from "../../middlewares/restrict";
import { validate } from "../../middlewares/validate";
import { StudentRequestController } from "./studentRequests.controller";
import { StudentRequestValidationSchemas } from "./studentRequests.validation";

const router = express.Router();

router.get(
  "/",
  protect,
  restrict(Role.INSTRUCTOR, Role.ASSISTANT),
  validate({ query: StudentRequestValidationSchemas.getCourseStudentRequestsQuery }),
  StudentRequestController.getCourseStudentRequests,
);

router.get(
  "/:id",
  protect,
  restrict(Role.INSTRUCTOR, Role.ASSISTANT),
  validate({ params: StudentRequestValidationSchemas.getCourseStudentRequestParams }),
  StudentRequestController.getCourseStudentRequestById,
);

router.post(
  "/",
  protect,
  restrict(Role.STUDENT),
  validate({ body: StudentRequestValidationSchemas.createStudentRequestBody }),
  StudentRequestController.createStudentRequest,
);

router.patch(
  "/:id/answer",
  protect,
  restrict(Role.INSTRUCTOR, Role.ASSISTANT),
  validate({
    params: StudentRequestValidationSchemas.getCourseStudentRequestParams,
    body: StudentRequestValidationSchemas.answerStudentRequestBody,
  }),
  StudentRequestController.answerStudentRequest,
);

router.delete(
  "/:id",
  protect,
  restrict(Role.STUDENT),
  validate({ params: StudentRequestValidationSchemas.getCourseStudentRequestParams }),
  StudentRequestController.deleteStudentRequest,
);

export default router;
