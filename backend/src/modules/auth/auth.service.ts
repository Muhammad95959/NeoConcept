import bcrypt from "bcryptjs";
import crypto from "crypto";
import { promises as fs } from "fs";
import CustomError from "../../types/customError";
import { HttpStatusText } from "../../types/HTTPStatusText";
import {
  ConfirmEmailInput,
  ForgotPasswordInput,
  LoginInput,
  MobileGoogleAuthInput,
  MobileGoogleAuthQuery,
  ResendConfirmationEmailInput,
  ResetPasswordInput,
  SignupInput,
  VerifyOTPInput,
} from "./auth.validation";
import sendEmail from "../../utils/sendEmail";
import signToken from "../../utils/signToken";
import safeUserData from "../../utils/safeUserData";
import createRandomOTP from "../../utils/createRandomOTP";
import { OAuth2Client } from "google-auth-library";
import { Role } from "../../generated/prisma";
import { AuthModel } from "./auth.model";

export class AuthService {
  private static readonly MAX_OTP_ATTEMPTS = 5;

  private static oauthClient: OAuth2Client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  static async signup({ email, username, password, role }: SignupInput) {
    const existingUser = await AuthModel.findUserByEmail(email.toLowerCase());
    if (existingUser) {
      throw new CustomError("Email is already in use", 409, HttpStatusText.FAIL);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const confirmEmailToken = crypto.randomBytes(32).toString("hex");
    const confirmEmailTokenHash = crypto.createHash("sha256").update(confirmEmailToken).digest("hex");

    await AuthModel.createUser({
      email: email.toLowerCase(),
      username,
      password: hashedPassword,
      role: role,
      emailConfirmed: process.env.NODE_ENV === "development",
      confirmEmailToken: process.env.NODE_ENV === "development" ? confirmEmailTokenHash : null,
      confirmEmailExpires: process.env.NODE_ENV === "development" ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null,
    });

    return {
      confirmEmailToken,
      isDev: process.env.NODE_ENV === "development",
    };
  }

  static async confirmEmail({ token }: ConfirmEmailInput) {
    const failHtml = await fs.readFile("public/emailVerificationFailure.html", "utf-8");

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const user = await AuthModel.findUserByConfirmToken(tokenHash);

    if (!user) {
      throw new CustomError("Invalid or expired token", 400, HttpStatusText.FAIL, failHtml);
    }

    await AuthModel.confirmUserEmail(user.id);

    const successHtml = await fs.readFile("public/emailVerificationSuccess.html", "utf-8");

    return successHtml;
  }

  static async resendConfirmationEmail({email}: ResendConfirmationEmailInput) {
    const user = await AuthModel.findUserByEmail(email);
    if (!user) throw new CustomError("User not found", 404, HttpStatusText.FAIL);
    if (user.emailConfirmed) throw new CustomError("Email already confirmed", 400, HttpStatusText.FAIL);

    const confirmEmailToken = crypto.randomBytes(32).toString("hex");
    const confirmEmailTokenHash = crypto.createHash("sha256").update(confirmEmailToken).digest("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await AuthModel.updateConfirmationToken(user.id, confirmEmailTokenHash, expires);

    const rawMessage = await fs.readFile("public/emailConfirmationMessage.html", "utf-8");
    const message = rawMessage.replaceAll(
      "%%CONFIRMATION_LINK%%",
      `${process.env.APP_URL}/api/v1/auth/confirm-email/${confirmEmailToken}`,
    );

    sendEmail(email, "NeoConcept - Email Confirmation", message, true);

    return { success: true };
  }

  static async login({ email, password }: LoginInput) {

    const user = await AuthModel.findUserByEmail(email);

    if (!user || !user.password) {
      throw new CustomError("Invalid credentials", 400, HttpStatusText.FAIL);
    }

    const passwordIsValid = await bcrypt.compare(password, user.password);

    if (!passwordIsValid) {
      throw new CustomError("Invalid credentials", 400, HttpStatusText.FAIL);
    }

    if (!user.emailConfirmed) {
      throw new CustomError("Please confirm your email first", 403, HttpStatusText.FAIL);
    }

    const token = signToken(user.id);

    return {
      token,
      user: safeUserData(user),
    };
  }

  static async forgotPassword({email}: ForgotPasswordInput) {
    const user = await AuthModel.findUserByEmail(email);

    if (!user) {
      throw new CustomError("User not found", 404, HttpStatusText.FAIL);
    }

    const otp = createRandomOTP(6);

    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    const expires = new Date(Date.now() + 20 * 60 * 1000);

    await AuthModel.updateResetPasswordOTP(user.id, otpHash, expires);

    const rawMessage = await fs.readFile("public/resetPasswordMessage.html", "utf-8");

    const message = rawMessage.replace("%%OTP%%", otp);

    sendEmail(user.email, "NeoConcept - Password Reset", message, true);

    return { message: "Password reset email was sent successfully" };
  }

  static async verifyOTP({email, otp}: VerifyOTPInput) {
    const user = await AuthModel.findUserByEmail(email.toLowerCase());

    if (!user) {
      throw new CustomError("User not found", 404, HttpStatusText.FAIL);
    }

    if (!user.resetPasswordOTP) {
      throw new CustomError("No OTP request found", 400, HttpStatusText.FAIL);
    }

    if (user.otpAttempts >= AuthService.MAX_OTP_ATTEMPTS) {
      throw new CustomError("Too many attempts. Please request a new OTP", 429, HttpStatusText.FAIL);
    }

    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    if (user.resetPasswordOTP !== otpHash) {
      await AuthModel.incrementOtpAttempts(user.id);

      throw new CustomError("Invalid OTP", 400, HttpStatusText.FAIL);
    }

    if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      throw new CustomError("OTP has expired", 400, HttpStatusText.FAIL);
    }

    await Promise.all([AuthModel.clearResetOTP(user.id), AuthModel.resetOtpAttempts(user.id)]);

    return {
      success: true,
      message: "OTP verified successfully",
    };
  }

  static async resetPassword({ email, otp, newPassword }: ResetPasswordInput) {
    const user = await AuthModel.findUserByEmail(email.toLowerCase());

    if (!user) {
      throw new CustomError("User not found", 404, HttpStatusText.FAIL);
    }

    if (!user.resetPasswordOTP) {
      throw new CustomError("No reset request found", 400, HttpStatusText.FAIL);
    }

    if (user.otpAttempts >= AuthService.MAX_OTP_ATTEMPTS) {
      throw new CustomError("Too many attempts. Please request a new OTP", 429, HttpStatusText.FAIL);
    }

    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    if (user.resetPasswordOTP !== otpHash) {
      await AuthModel.incrementOtpAttempts(user.id);

      throw new CustomError("Invalid OTP", 400, HttpStatusText.FAIL);
    }

    if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      throw new CustomError("OTP has expired", 400, HttpStatusText.FAIL);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await Promise.all([
      AuthModel.updateUserPassword(user.id, hashedPassword),
      AuthModel.clearResetOTP(user.id),
      AuthModel.resetOtpAttempts(user.id),
    ]);

    return {
      success: true,
      message: "Password was reset successfully",
    };
  }

  static async mobileGoogleAuth(body: MobileGoogleAuthInput, query: MobileGoogleAuthQuery) {
    let role: Role = Role.STUDENT;

    switch (String(query.role)?.toUpperCase()) {
      case Role.ADMIN:
        role = Role.ADMIN;
        break;
      case Role.INSTRUCTOR:
        role = Role.INSTRUCTOR;
        break;
      case Role.ASSISTANT:
        role = Role.ASSISTANT;
    }

    const ticket = await AuthService.oauthClient.verifyIdToken({
      idToken: body.idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload) throw new CustomError("Invalid Google token", 400, HttpStatusText.FAIL);

    const { email, name, sub: googleId } = payload;

    let user = await AuthModel.findUserByEmail(email!);

    if (user) {
      if (role && user.role !== role) throw new CustomError("Role mismatch", 400, HttpStatusText.FAIL);
      if (!user.googleId) user = await AuthModel.updateUserGoogleId(user.id, googleId!);
    } else {
      user = await AuthModel.createUserWithGoogle(email!, name!, googleId!, role);
    }

    const token = signToken(user.id);

    return { token, user: safeUserData(user) };
  }
}
