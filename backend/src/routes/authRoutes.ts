import express from "express";
import * as authController from "../controllers/authController";
import passport from "passport";
import signToken from "../utils/signToken";
import safeUserData from "../utils/safeUserData";
import { User } from "@prisma/client";

const router = express.Router();

router.post("/signup", authController.signup);

router.get("/confirm-email/:token", authController.confirmEmail)

router.post("/resend-confirmation-email", authController.resendConfirmationEmail);

router.post("/login", authController.login);

router.get("/google", (req, res, next) => {
  const role = String(req.query.instructor).toLowerCase() === "true" ? "INSTRUCTOR" : "STUDENT";
  return passport.authenticate("google", { scope: ["profile", "email"], state: JSON.stringify({ instructor: role }) })(
    req,
    res,
    next,
  );
});

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
  }),
  (req, res) => {
    const token = signToken((req.user as User).id);
    res.status(200).json({ status: "success", token, data: safeUserData(req.user as User) });
  },
);

router.post("/forgot-password", authController.forgotPassword);

router.patch("/reset-password/:token", authController.resetPassword);

export default router;
