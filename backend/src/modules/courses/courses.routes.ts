import express from "express";
import { Role } from "../../generated/prisma/client";
import * as authController from "../auth/auth.controller";
import * as coursesController from "./courses.controller";

const router = express.Router();

router.get("/", coursesController.getCourses);

router.get("/:id", coursesController.getCourseById);

router.post("/", authController.protect, authController.restrict(Role.ADMIN), coursesController.createCourse);

router.patch("/:id", authController.protect, authController.restrict(Role.ADMIN), coursesController.updateCourse);

router.delete("/:id", authController.protect, authController.restrict(Role.ADMIN), coursesController.deleteCourse);

export default router;
