import { Role, User } from "../../generated/prisma/client";
import express from "express";
import passport from "passport";
import signToken from "../../utils/signToken";
import { validate } from "../../middlewares/validate";

import { protect } from "../../middlewares/protect";
import { AuthValidationSchemas } from "./auth.validation";
import { AuthController } from "./auth.controller";
import { Constants } from "../../types/constants";

const router = express.Router();
const getFrontendOrigin = () => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

  if (frontendUrl.endsWith(":")) {
    return `${frontendUrl}3000`;
  }

  return frontendUrl;
};

router.get("/", protect, AuthController.authorize);

router.post("/signup", validate({ body: AuthValidationSchemas.signup }), AuthController.signup);

router.get(
  "/confirm-email/:token",
  validate({ params: AuthValidationSchemas.confirmEmailParams }),
  AuthController.confirmEmail,
);

router.post(
  "/resend-confirmation-email",
  validate({ body: AuthValidationSchemas.resendConfirmationEmailBody }),
  AuthController.resendConfirmationEmail,
);

router.post("/login", validate({ body: AuthValidationSchemas.loginBody }), AuthController.login);

router.get("/logout", AuthController.logout);

router.post(
  "/forgot-password",
  validate({ body: AuthValidationSchemas.forgotPasswordBody }),
  AuthController.forgotPassword,
);

router.post("/verify-otp", validate({ body: AuthValidationSchemas.verifyOTPBody }), AuthController.verifyOTP);

router.patch("/reset-password", validate({ body: AuthValidationSchemas.resetPasswordBody }), AuthController.resetPassword);

router.post(
  "/google/mobile",
  validate({
    body: AuthValidationSchemas.mobileGoogleAuthBody,
    query: AuthValidationSchemas.mobileGoogleAuthQuery,
  }),
  AuthController.mobileGoogleAuth,
);

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
    res.cookie("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === Constants.PRODUCTION,
      sameSite: process.env.NODE_ENV === Constants.PRODUCTION ? "none" : "lax",
    });
    res.redirect(new URL("/login/success", getFrontendOrigin()).toString());
  },
);

export default router;
