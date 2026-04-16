import express from "express";
import { Role } from "../../generated/prisma/client";
import { protect } from "../../middlewares/protect";
import { restrict } from "../../middlewares/restrict";
import { validate } from "../../middlewares/validate";
import { CourseController } from "./course.controller";
import { CourseValidationSchemas } from "./course.validation";

const router = express.Router();

router.get("/", validate({ query: CourseValidationSchemas.getManyQuery }), CourseController.getMany);

router.get("/:id", validate({ params: CourseValidationSchemas.idParams }), CourseController.get);

router.post(
  "/",
  protect,
  restrict(Role.ADMIN),
  validate({ body: CourseValidationSchemas.createBody }),
  CourseController.create,
);

router.patch(
  "/:id",
  protect,
  restrict(Role.ADMIN),
  validate({ body: CourseValidationSchemas.updateBody, params: CourseValidationSchemas.idParams }),
  CourseController.update,
);

router.put(
  "/:id/prerequisites",
  protect,
  restrict(Role.ADMIN),
  validate({
    body: CourseValidationSchemas.updatePrerequisitesBody,
    params: CourseValidationSchemas.idParams,
  }),
  CourseController.updatePrerequisites,
);

router.put(
  "/:id/staff",
  protect,
  restrict(Role.ADMIN),
  validate({ body: CourseValidationSchemas.updateStaffBody, params: CourseValidationSchemas.idParams }),
  CourseController.updateStaff,
);

router.delete(
  "/:id",
  protect,
  restrict(Role.ADMIN),
  validate({ params: CourseValidationSchemas.idParams }),
  CourseController.delete,
);

export default router;
