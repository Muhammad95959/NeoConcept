import { HttpStatusText } from "./HTTPStatusText"

export default class CustomError extends Error {
  statusCode: number;
  statusText: string;
  isJoi?: boolean;
  constructor(
    message: string,
    statusCode = 500,
    statusText = HttpStatusText.ERROR,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.statusText = statusText;
    Error.captureStackTrace(this, this.constructor);
  }
}
