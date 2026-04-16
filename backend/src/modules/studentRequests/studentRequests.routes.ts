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
  validate({ query: StudentRequestValidationSchemas.getManyQuery }),
  StudentRequestController.getMany,
);

router.get(
  "/:id",
  protect,
  restrict(Role.INSTRUCTOR, Role.ASSISTANT),
  validate({ params: StudentRequestValidationSchemas.idParams }),
  StudentRequestController.getById,
);

router.post(
  "/",
  protect,
  restrict(Role.STUDENT),
  validate({ body: StudentRequestValidationSchemas.createBody }),
  StudentRequestController.create,
);

router.patch(
  "/:id/answer",
  protect,
  restrict(Role.INSTRUCTOR, Role.ASSISTANT),
  validate({
    params: StudentRequestValidationSchemas.idParams,
    body: StudentRequestValidationSchemas.answerBody,
  }),
  StudentRequestController.answer,
);

router.delete(
  "/:id",
  protect,
  restrict(Role.STUDENT),
  validate({ params: StudentRequestValidationSchemas.idParams }),
  StudentRequestController.delete,
);

export default router;
