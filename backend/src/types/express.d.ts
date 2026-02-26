import { ZodTypeAny } from "zod";

declare module "express-serve-static-core" {
  interface Request {
    validated?: {
      body?: any;
      params?: any;
      query?: any;
    };
  }
}