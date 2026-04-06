import { Request, Response, NextFunction } from "express";
import { Role } from "../generated/prisma";
import { HTTPStatusText } from "../types/HTTPStatusText";
import { ErrorMessages } from "../types/errorsMessages";

export default function verifyCurrentTrack(_req: Request, res: Response, next: NextFunction) {
  const user = res.locals.user;
  if (user.currentTrackId && user.role !== Role.STUDENT)
    return res.status(400).json({ status: HTTPStatusText.FAIL, message: ErrorMessages.YOU_ARE_ALREADY_ENROLLED_IN_A_TRACK });
  next();
}
