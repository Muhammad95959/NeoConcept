import { HTTPStatusText } from "./HTTPStatusText";

export default class CustomError extends Error {
  statusCode: number;
  statusText: string;
  html?: string;
  isJoi?: boolean;
  constructor(message: string, statusCode = 500, statusText = HTTPStatusText.ERROR, html = "") {
    super(message);
    this.statusCode = statusCode;
    this.statusText = statusText;
    this.html = html;
    Error.captureStackTrace(this, this.constructor);
  }
}
