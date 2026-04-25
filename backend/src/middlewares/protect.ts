import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/verifyToken";
import { HTTPStatusText } from "../types/HTTPStatusText";

export async function protect(req: Request, res: Response, next: NextFunction) {
  try {
    let token: string | undefined;

    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }
    const user = await verifyToken(token);

    res.locals.user = user;
    next();
  } catch (err: any) {
    res.status(err.statusCode || 401).json({
      status: HTTPStatusText.FAIL,
      message: err.message || "Unauthorized",
    });
  }
}
