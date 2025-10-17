import express from "express";
import * as authController from "../controllers/authController";
import passport from "passport";
import signToken from "../utils/signToken";
import { Role, User } from "@prisma/client";

const router = express.Router();

router.get("/", authController.protect, authController.authorize);

router.post("/signup", authController.signup);

router.get("/confirm-email/:token", authController.confirmEmail);

router.post("/resend-confirmation-email", authController.resendConfirmationEmail);

router.post("/login", authController.login);

router.get("/logout", authController.logout);

router.post("/forgot-password", authController.forgotPassword);

router.post("/verify-otp", authController.verifyOTP);

router.patch("/reset-password/:otp", authController.resetPassword);

router.post("/google/mobile", authController.mobileGoogleAuth);

router.get("/google", (req, res, next) => {
  const role = String(req.query.instructor).toLowerCase() === "true" ? Role.INSTRUCTOR : Role.STUDENT;
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
