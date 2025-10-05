import signToken from "../utils/signToken";
import bcrypt from "bcryptjs";
import { NextFunction, Request, Response } from "express";
import { PrismaClient, Role } from "@prisma/client";
import safeUserData from "../utils/safeUserData";
import sendEmail from "../utils/sendEmail";
import crypto from "crypto";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

// TODO: send a confirmation request to the admin to allow users with role instructor to be created
export async function signup(req: Request, res: Response) {
  const { email, username, password, role } = req.body;
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
    const message = `Click the link below to confirm your email address\n\n${req.protocol}://${req.get("host")}/api/v1/auth/confirm-email/${confirmEmailToken}`;
    sendEmail(email, "NeoConcept - Email Confirmation", message);
    res.status(201).json({ status: "success", message: "Please confirm your email" });
  } catch (err) {
    console.log((err as Error).message);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function confirmEmail(req: Request, res: Response) {
  try {
    const confirmEmailTokenHash = crypto.createHash("sha256").update(req.params.token).digest("hex");
    const user = await prisma.user.findFirst({
      where: {
        confirmEmailToken: confirmEmailTokenHash,
        confirmEmailExpires: { gt: new Date() },
      },
    });
    if (!user) return res.status(400).json({ status: "fail", message: "Invalid or expired token" });
    await prisma.user.update({
      where: { id: user.id },
      data: { emailConfirmed: true, confirmEmailToken: null, confirmEmailExpires: null },
    });
    res.status(200).json({ status: "success", message: "Email confirmed successfully" });
  } catch (err) {
    console.log((err as Error).message);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
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
    const message = `Click the link below to confirm your email address\n\n${req.protocol}://${req.get("host")}/api/v1/auth/confirm-email/${confirmEmailToken}`;
    sendEmail(email, "NeoConcept - Email Confirmation", message);
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
    const resetPasswordToken = crypto.randomBytes(32).toString("hex");
    const resetPasswordTokenHash = crypto.createHash("sha256").update(resetPasswordToken).digest("hex");
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetPasswordTokenHash,
        resetPasswordExpires: new Date(Date.now() + 20 * 60 * 1000),
      },
    });
    const message = `Click the link below to reset your password\n\n${req.protocol}://${req.get("host")}/api/v1/auth/reset-password/${resetPasswordToken}`;
    sendEmail(email, "NeoConcept - Password Reset", message);
    res.status(201).json({ status: "success", message: "Password reset email was sent successfully" });
  } catch (err) {
    console.log((err as Error).message);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function resetPassword(req: Request, res: Response) {
  try {
    const resetPasswordTokenHash = crypto.createHash("sha256").update(req.params.token).digest("hex");
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: resetPasswordTokenHash,
        resetPasswordExpires: { gt: new Date() },
      },
    });
    if (!user) return res.status(400).json({ status: "fail", message: "Invalid or expired token" });
    const { newPassword } = req.body;
    if (!newPassword) return res.status(400).json({ status: "fail", message: "Provide a new password" });
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
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
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer "))
    return res.status(401).json({ status: "fail", message: "You are not logged in" });
  const token = authHeader.split(" ")[1];
  try {
    if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not defined");
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const { id, iat } = decodedToken as { id: number; iat: number; exp: number };
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
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export function restrict(...roles: Role[]) {
  return function (_req: Request, res: Response, next: NextFunction) {
    if (!roles.includes(res.locals.user.role))
      return res.status(403).json({ status: "fail", message: "You do not have permission to perform this action" });
    next();
  };
}
