import { Request } from "express";

export interface IAuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    iat?: string;
    exp?: string
  };
}
