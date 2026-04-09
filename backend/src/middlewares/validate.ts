import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { HTTPStatusText } from "../types/HTTPStatusText";

export const validate =
  (schema: {
    body?: ZodSchema;
    params?: ZodSchema;
    query?: ZodSchema;
  }) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schema.body) res.locals.body = schema.body.parse(req.body);;
      if (schema.params) res.locals.params = schema.params.parse(req.params);
      if (schema.query) res.locals.query = schema.query.parse(req.query);

      next();
    } catch (err: any) {
      return res.status(400).json({
        status: HTTPStatusText.FAIL,
        message: err.errors?.[0]?.message || "Validation error",
      });
    }
  };
