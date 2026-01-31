import { Role, User } from "../../generated/prisma/client";
import express from "express";
import passport from "passport";
import * as authController from "./auth.controller";
import signToken from "../../utils/signToken";

const router = express.Router();

router.get("/", authController.protect, authController.authorize);

router.post("/signup", authController.signup);

router.get("/confirm-email/:token", authController.confirmEmail);

router.post("/resend-confirmation-email", authController.resendConfirmationEmail);

router.post("/login", authController.login);

router.get("/logout", authController.logout);

router.post("/forgot-password", authController.forgotPassword);

router.post("/verify-otp", authController.verifyOTP);

router.patch("/reset-password", authController.resetPassword);

router.post("/google/mobile", authController.mobileGoogleAuth);

router.get("/google", (req, res, next) => {
  let role: Role = Role.STUDENT;
  switch (String(req.query.role).toUpperCase()) {
    case Role.ADMIN:
      role = Role.ADMIN;
      break;
    case Role.INSTRUCTOR:
      role = Role.INSTRUCTOR;
      break;
    case Role.ASSISTANT:
      role = Role.ASSISTANT;
  }
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
    res.cookie("jwt", token, { httpOnly: true, secure: process.env.NODE_ENV === "production" });
    res.redirect(process.env.FRONTEND_URL + "/login/success");
  },
);

export default router;
