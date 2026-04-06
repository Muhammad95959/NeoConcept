import { Request, Response, NextFunction } from "express";
import { Role } from "../generated/prisma/client";
import { HTTPStatusText } from "../types/HTTPStatusText";
import { ErrorMessages } from "../types/errorsMessages";

export const restrict =
  (...roles: Role[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = res.locals.user;

      if (!user) {
        return res.status(401).json({
          status: HTTPStatusText.FAIL,
          message: ErrorMessages.NOT_LOGIN_YET,
        });
      }

      if (!roles.includes(user.role)) {
        return res.status(403).json({
          status: HTTPStatusText.FAIL,
          message: ErrorMessages.DONT_HAVE_PERMISSION_TO_PERFORM_THIS_ACTION,
        });
      }

      next();
    } catch (err) {
      next(err);
    }
  };