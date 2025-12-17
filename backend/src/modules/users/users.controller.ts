import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import prisma from "../../config/db";

export async function updateUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { password, username } = req.body;
    if (id !== res.locals.user.id) return res.status(401).json({ status: "fail", message: "Unauthorized" });
    if (!username?.trim() && !password)
      return res.status(400).json({ status: "fail", message: "Username or password is required" });
    const data: any = {};
    if (username?.trim()) data.username = username.trim();
    if (password) data.password = await bcrypt.hash(password, 10);
    await prisma.user.update({ where: { id }, data });
    res.status(200).json({ status: "success", message: "User updated successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}

export async function deleteUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (id !== res.locals.user.id) return res.status(401).json({ status: "fail", message: "Unauthorized" });
    await prisma.user.update({ where: { id }, data: { deletedAt: new Date() } });
    res.status(200).json({ status: "success", message: "User deleted successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
}
