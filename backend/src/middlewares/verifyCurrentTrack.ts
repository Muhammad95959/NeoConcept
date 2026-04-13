import { Request, Response, NextFunction } from "express";
import { Role } from "../generated/prisma";
import { HTTPStatusText } from "../types/HTTPStatusText";
import { ErrorMessages } from "../types/errorsMessages";
import prisma from "../config/db";

export default async function verifyCurrentTrack(_req: Request, res: Response, next: NextFunction) {
  try {
    const user = res.locals.user;
    const hasActiveTrack = (await prisma.userTrack.count({ where: { userId: user.id, deletedAt: null } })) > 0;

    if (hasActiveTrack && user.role === Role.ADMIN)
      return res
        .status(400)
        .json({ status: HTTPStatusText.FAIL, message: ErrorMessages.YOU_ARE_ALREADY_ENROLLED_IN_A_TRACK });

    next();
  } catch (error) {
    next(error);
  }
}
