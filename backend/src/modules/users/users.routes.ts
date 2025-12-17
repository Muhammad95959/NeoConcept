import express from "express";
import * as authController from "../auth/auth.controller";
import * as usersController from "./users.controller";

const router = express.Router();

router.patch("/:id", authController.protect, usersController.updateUser);

router.delete("/:id", authController.protect, usersController.deleteUser);

router.patch("/:id/select-track", authController.protect, usersController.selectTrack);

router.patch("/:id/quit-track", authController.protect, usersController.quitTrack);

export default router;
