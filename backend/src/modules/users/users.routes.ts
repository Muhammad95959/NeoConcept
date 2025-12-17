import express from "express";
import * as authController from "../auth/auth.controller";
import * as usersController from "./users.controller";

const router = express.Router();

router.patch("/:id", authController.protect, usersController.updateUser);

router.delete("/:id", authController.protect, usersController.deleteUser);

export default router;
