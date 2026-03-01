import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

export const validate =
  (schema: {
    body?: ZodSchema;
    params?: ZodSchema;
    query?: ZodSchema;
  }) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      req.validated = {};
      if (schema.body) req.validated.body = schema.body.parse(req.body);
      if (schema.params) req.validated.params = schema.params.parse(req.params);
      if (schema.query) req.validated.query = schema.query.parse(req.query);

      next();
    } catch (err: any) {
      console.log(err);
      return res.status(400).json({
        status: "fail",
        message: err.errors?.[0]?.message || "Validation error",
      });
    }
  };