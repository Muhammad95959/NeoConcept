import express from "express";
import { Role } from "../../generated/prisma/client";
import { protect } from "../../middlewares/protect";
import { restrict } from "../../middlewares/restrict";
import { CourseController } from "./course.controller";
import { CourseValidationSchemas } from "./course.validation";
import { validate } from "../../middlewares/validate";

const router = express.Router();

router.get("/", validate({ query: CourseValidationSchemas.getMany }), CourseController.getMany);

router.get("/:id", validate({ params: CourseValidationSchemas.get }), CourseController.get);

router.post(
  "/",
  protect,
  restrict(Role.ADMIN),
  validate({ body: CourseValidationSchemas.create }),
  CourseController.create,
);

router.patch(
  "/:id",
  protect,
  restrict(Role.ADMIN),
  validate({ body: CourseValidationSchemas.updateBody, params: CourseValidationSchemas.updateParmas }),
  CourseController.update,
);

router.put("/:id/staff", protect, restrict(Role.ADMIN), CourseController.updateStaff);

router.delete("/:id", protect, restrict(Role.ADMIN), CourseController.delete);

export default router;
