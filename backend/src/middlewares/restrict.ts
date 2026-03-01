import { Request, Response, NextFunction } from "express";
import { Role } from "../generated/prisma/client";
import { HttpStatusText } from "../types/HTTPStatusText";

export const restrict =
  (...roles: Role[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = res.locals.user;

      if (!user) {
        return res.status(401).json({
          status: HttpStatusText.FAIL,
          message: "You are not logged in",
        });
      }

      if (!roles.includes(user.role)) {
        return res.status(403).json({
          status: HttpStatusText.FAIL,
          message: "You do not have permission to perform this action",
        });
      }

      next();
    } catch (err) {
      next(err);
    }
  };