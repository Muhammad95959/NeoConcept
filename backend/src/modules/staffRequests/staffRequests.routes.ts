import express from "express";
import { Role } from "../../generated/prisma";
import { protect } from "../../middlewares/protect";
import { restrict } from "../../middlewares/restrict";
import { validate } from "../../middlewares/validate";
import { StaffRequestController } from "./staffRequests.controller";
import { StaffRequestValidationSchemas } from "./staffRequests.validation";

const router = express.Router();

router.get("/", protect, restrict(Role.ADMIN), StaffRequestController.getMany);

router.get(
  "/:id",
  protect,
  restrict(Role.ADMIN),
  validate({ params: StaffRequestValidationSchemas.idParams }),
  StaffRequestController.get,
);

router.post(
  "/",
  protect,
  restrict(Role.INSTRUCTOR, Role.ASSISTANT),
  validate({ body: StaffRequestValidationSchemas.createBody }),
  StaffRequestController.create,
);

router.patch(
  "/:id",
  protect,
  restrict(Role.INSTRUCTOR, Role.ASSISTANT),
  validate({ params: StaffRequestValidationSchemas.idParams, body: StaffRequestValidationSchemas.updateBody }),
  StaffRequestController.update,
);

router.patch(
  "/:id/answer",
  protect,
  restrict(Role.ADMIN),
  validate({ params: StaffRequestValidationSchemas.idParams, body: StaffRequestValidationSchemas.answerBody }),
  StaffRequestController.answer,
);

router.delete(
  "/:id",
  protect,
  restrict(Role.INSTRUCTOR, Role.ASSISTANT),
  validate({ params: StaffRequestValidationSchemas.idParams }),
  StaffRequestController.delete,
);

export default router;
