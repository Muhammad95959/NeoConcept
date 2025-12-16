import { Role } from "../../generated/prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { NextFunction, Request, Response } from "express";
import { promises as fs } from "fs";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import prisma from "../../config/db";
import createRandomOTP from "../../utils/createRandomOTP";
import safeUserData from "../../utils/safeUserData";
import sendEmail from "../../utils/sendEmail";
import signToken from "../../utils/signToken";

const oauthClient = new OAuth2Client();

// TODO: send a confirmation request to the admin to allow users with role instructor to be created
export async function signup(req: Request, res: Response) {
  const { email, username, password, role } = req.body;
  if (!email || !username || !password || !role) {
    return res.status(400).json({
      status: "fail",
      message: "Email, username, password and role are required",
    });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const confirmEmailToken = crypto.randomBytes(32).toString("hex");
    const confirmEmailTokenHash = crypto.createHash("sha256").update(confirmEmailToken).digest("hex");
    await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        username,
        password: hashedPassword,
        role: role.toUpperCase(),
        confirmEmailToken: confirmEmailTokenHash,
        confirmEmailExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    const rawMessage = await fs.readFile("public/emailConfirmationMessage.html", "utf-8");
    const message = rawMessage.replaceAll(
      "%%CONFIRMATION_LINK%%",
      `${req.protocol}://${req.get("host")}/api/v1/auth/confirm-email/${confirmEmailToken}`,
    );
    sendEmail(email, "NeoConcept - Email Confirmation", message, true);
    res.status(201).json({ status: "success", message: "Please confirm your email" });
  } catch (err) {
    console.log((err as Error).message);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function confirmEmail(req: Request, res: Response) {
  const failHtml = await fs.readFile("public/emailVerificationFailure.html", "utf-8");
  try {
    const confirmEmailTokenHash = crypto.createHash("sha256").update(req.params.token).digest("hex");
    const user = await prisma.user.findFirst({
      where: { confirmEmailToken: confirmEmailTokenHash, confirmEmailExpires: { gt: new Date() } },
    });
    if (!user) return res.status(400).send(failHtml);
    await prisma.user.update({
      where: { id: user.id },
      data: { emailConfirmed: true, confirmEmailToken: null, confirmEmailExpires: null },
    });
    const successHtml = await fs.readFile("public/emailVerificationSuccess.html", "utf-8");
    res.status(200).send(successHtml);
  } catch (err) {
    console.log(err);
    res.status(500).send(failHtml);
  }
}

export async function resendConfirmationEmail(req: Request, res: Response) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ status: "fail", message: "Email is required" });
  try {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return res.status(404).json({ status: "fail", message: "User not found" });
    if (user.emailConfirmed) return res.status(400).json({ status: "fail", message: "Email already confirmed" });
    const confirmEmailToken = crypto.randomBytes(32).toString("hex");
    const confirmEmailTokenHash = crypto.createHash("sha256").update(confirmEmailToken).digest("hex");
    await prisma.user.update({
      where: { id: user.id },
      data: {
        confirmEmailToken: confirmEmailTokenHash,
        confirmEmailExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    const rawMessage = await fs.readFile("public/emailConfirmationMessage.html", "utf-8");
    const message = rawMessage.replaceAll(
      "%%CONFIRMATION_LINK%%",
      `${req.protocol}://${req.get("host")}/api/v1/auth/confirm-email/${confirmEmailToken}`,
    );
    sendEmail(email, "NeoConcept - Email Confirmation", message, true);
    res.status(201).json({ status: "success", message: "New confirmation email was sent successfully" });
  } catch (err) {
    console.log((err as Error).message);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ status: "fail", message: "Please provide email and password" });
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) return res.status(400).json({ status: "fail", message: "Invalid credentials" });
    const passwordIsValid = await bcrypt.compare(password, user.password);
    if (!passwordIsValid) return res.status(400).json({ status: "fail", message: "Invalid credentials" });
    if (!user.emailConfirmed)
      return res.status(403).json({ status: "fail", message: "Please confirm your email first" });
    const token = signToken(user.id);
    res.cookie("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });
    res.status(200).json({ status: "success", token, data: safeUserData(user) });
  } catch (err) {
    console.log((err as Error).message);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return res.status(404).json({ status: "fail", message: "User not found" });
    const otp = createRandomOTP(6);
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordOTP: otpHash,
        resetPasswordExpires: new Date(Date.now() + 20 * 60 * 1000),
      },
    });
    const rawMessage = await fs.readFile("public/resetPasswordMessage.html", "utf-8");
    const message = rawMessage.replace("%%OTP%%", otp);
    sendEmail(email, "NeoConcept - Password Reset", message, true);
    res.status(201).json({ status: "success", message: "Password reset email was sent successfully" });
  } catch (err) {
    console.log((err as Error).message);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function verifyOTP(req: Request, res: Response) {
  const { otp, email } = req.body;
  try {
    if (!otp) return res.status(400).json({ status: "fail", message: "Provide the OTP" });
    if (!email) return res.status(400).json({ status: "fail", message: "Provide the email" });
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ status: "fail", message: "User not found" });
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    if (user.resetPasswordOTP !== otpHash) return res.status(400).json({ status: "fail", message: "Invalid OTP" });
    if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date())
      return res.status(400).json({ status: "fail", message: "OTP has expired" });
    res.status(200).json({ status: "success", message: "OTP verified successfully" });
  } catch (err) {
    console.log((err as Error).message);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function resetPassword(req: Request, res: Response) {
  const { otp } = req.params;
  const { email, newPassword } = req.body;
  try {
    if (!email) return res.status(400).json({ status: "fail", message: "Provide the email" });
    if (!newPassword) return res.status(400).json({ status: "fail", message: "Provide a new password" });
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ status: "fail", message: "User not found" });
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    if (user.resetPasswordOTP !== otpHash) return res.status(400).json({ status: "fail", message: "Invalid OTP" });
    if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date())
      return res.status(400).json({ status: "fail", message: "OTP has expired" });
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordOTP: null,
        resetPasswordExpires: null,
        passwordChangedAt: new Date(),
      },
    });
    res.status(200).json({ status: "success", message: "Password was reset successfully" });
  } catch (err) {
    console.log((err as Error).message);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function protect(req: Request, res: Response, next: NextFunction) {
  let token: string | undefined;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) return res.status(401).json({ status: "fail", message: "You are not logged in" });
  try {
    if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not defined");
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const { id, iat } = decodedToken as { id: string; iat: number; exp: number };
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user)
      return res.status(401).json({ status: "fail", message: "The user belonging to this token no longer exists" });
    if (user.passwordChangedAt) {
      const isPasswordChanged = new Date(user.passwordChangedAt).getTime() / 1000 > iat;
      if (isPasswordChanged)
        return res
          .status(401)
          .json({ status: "fail", message: "User recently changed password! Please log in again." });
    }
    res.locals.user = user;
    next();
  } catch (err) {
    console.log((err as Error).message);
    res.status(401).json({ status: "fail", message: "Invalid or expired token" });
  }
}

export function restrict(...roles: Role[]) {
  return function (_req: Request, res: Response, next: NextFunction) {
    if (!roles.includes(res.locals.user.role))
      return res.status(403).json({ status: "fail", message: "You do not have permission to perform this action" });
    next();
  };
}

export function logout(_req: Request, res: Response) {
  res.clearCookie("jwt");
  res.status(200).json({ status: "success", message: "Logged out successfully" });
}

export function authorize(_req: Request, res: Response) {
  res.status(200).json({ status: "success", data: safeUserData(res.locals.user) });
}

export async function mobileGoogleAuth(req: Request, res: Response) {
  const { idToken } = req.body;
  const role = String(req.query.instructor).toLowerCase() === "true" ? Role.INSTRUCTOR : Role.STUDENT;
  try {
    const ticket = await oauthClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload) return res.status(400).json({ status: "fail", message: "Invalid token" });
    const { email, name, sub: googleId } = payload;
    let user = await prisma.user.findUnique({
      where: { email: email?.toLowerCase() },
    });
    if (user) {
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId, emailConfirmed: true },
        });
      }
    } else {
      user = await prisma.user.create({
        data: {
          email: email!,
          username: name!,
          googleId,
          emailConfirmed: true,
          role,
        },
      });
    }
    const token = signToken(user.id);
    res.status(200).json({ status: "success", token, data: safeUserData(user) });
  } catch (err) {
    console.log((err as Error).message);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}
