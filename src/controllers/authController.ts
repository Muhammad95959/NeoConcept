import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import IUser from "../interfaces/IUser";

const prisma = new PrismaClient();

function signToken(id: number) {
  const expiresIn = "30d";
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not defined");
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn });
}

function safeUserData(user: IUser) {
  const { id, email, username, role } = user;
  return { id, email, username, role };
}

// TODO: send a confirmation request to the admin to allow users with role instructor to be created
export async function signup(req: Request, res: Response) {
  const { email, username, password, role } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({ data: { email, username, password: hashedPassword, role } });
    const token = signToken(newUser.id);
    res.status(201).json({ status: "success", token, data: safeUserData(newUser) });
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
    if (!user) return res.status(400).json({ status: "fail", message: "Invalid credentials" });
    const passwordIsValid = await bcrypt.compare(password, user.password);
    if (!passwordIsValid) res.status(400).json({ status: "fail", message: "Invalid credentials" });
    const token = signToken(user.id);
    res.status(200).json({ status: "success", token, data: safeUserData(user) });
  } catch (err) {
    console.log((err as Error).message);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function forgotPassword(req: Request, res: Response) {}

export async function resetPassword(req: Request, res: Response) {}

export async function protect(req: Request, res: Response) {}
