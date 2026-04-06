import { Request, Response, NextFunction } from "express";
import { HTTPStatusText } from "../types/HTTPStatusText";
import { ErrorMessages } from "../types/errorsMessages";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  let statusCode = err.statusCode ?? 500;
  let message = err.message ?? "Internal Server Error";
  let statusText = err.statusText ?? HTTPStatusText.ERROR;
  if (err.name === "ZodError") {
    statusCode = 400;
    message = err.errors
      .map((e: any) => `${e.path.join(".")}: ${e.message}`)
      .join(", ");
    statusText = HTTPStatusText.FAIL;
  }

  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = ErrorMessages.INVALID_TOKEN;
    statusText = HTTPStatusText.FAIL;
  }
  console.error(err);
  res.status(statusCode).json({
    status: statusText,
    message,
  });
};
