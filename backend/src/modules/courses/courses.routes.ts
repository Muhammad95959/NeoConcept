import express from "express";
import { Role } from "../../generated/prisma/client";
import * as authController from "../auth/auth.controller";
import * as coursesController from "./courses.controller";
import { protect } from "../../middlewares/protect";
import { restrict } from "../../middlewares/restrict";

const router = express.Router();

router.get("/", coursesController.getCourses);

router.get("/:id", coursesController.getCourseById);

router.post("/", protect, restrict(Role.ADMIN), coursesController.createCourse);

router.patch("/:id", protect, restrict(Role.ADMIN), coursesController.updateCourse);

router.put("/:id/staff", protect, restrict(Role.ADMIN), coursesController.updateCourseStaff);

router.delete("/:id", protect, restrict(Role.ADMIN), coursesController.deleteCourse);

export default router;
