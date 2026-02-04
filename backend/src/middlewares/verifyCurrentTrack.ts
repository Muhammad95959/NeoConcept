import { Request, Response, NextFunction } from "express";
import { Role } from "../generated/prisma";

export default function verifyCurrentTrack(_req: Request, res: Response, next: NextFunction) {
  const user = res.locals.user;
  if (user.currentTrackId && user.role !== Role.STUDENT)
    return res.status(400).json({ status: "fail", message: "You’re already enrolled in a track" });
  next();
}
