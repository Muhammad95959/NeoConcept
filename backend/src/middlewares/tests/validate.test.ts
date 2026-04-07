import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { validate } from "../validate";
import { HTTPStatusText } from "../../types/HTTPStatusText";

describe("validate middleware", () => {
  const createRes = () => ({
    locals: {},
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as unknown as Response);

  const createReq = (body?: any, params?: any, query?: any) => ({
    body: body || {},
    params: params || {},
    query: query || {},
  } as unknown as Request);

  const createNext = () => jest.fn() as NextFunction;
  const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => undefined);

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
  });

  it("validates body and calls next", () => {
    const bodySchema = z.object({ email: z.string().email(), age: z.number() });
    const res = createRes();
    const next = createNext();
    const req = createReq({ email: "test@example.com", age: 25 });

    const middleware = validate({ body: bodySchema });
    middleware(req, res, next);

    expect(res.locals.body).toEqual({ email: "test@example.com", age: 25 });
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("validates params and calls next", () => {
    const paramsSchema = z.object({ id: z.string().uuid() });
    const res = createRes();
    const next = createNext();
    const req = createReq(undefined, { id: "550e8400-e29b-41d4-a716-446655440000" });

    const middleware = validate({ params: paramsSchema });
    middleware(req, res, next);

    expect(res.locals.params).toEqual({ id: "550e8400-e29b-41d4-a716-446655440000" });
    expect(next).toHaveBeenCalled();
  });

  it("validates query and calls next", () => {
    const querySchema = z.object({ page: z.string().transform(Number), limit: z.string().transform(Number) });
    const res = createRes();
    const next = createNext();
    const req = createReq(undefined, undefined, { page: "1", limit: "10" });

    const middleware = validate({ query: querySchema });
    middleware(req, res, next);

    expect(res.locals.query).toEqual({ page: 1, limit: 10 });
    expect(next).toHaveBeenCalled();
  });

  it("returns 400 on validation error", () => {
    const bodySchema = z.object({ email: z.string().email() });
    const res = createRes();
    const next = createNext();
    const req = createReq({ email: "not-an-email" });

    const middleware = validate({ body: bodySchema });
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: HTTPStatusText.FAIL,
      message: expect.any(String),
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("validates multiple schemas (body, params, query)", () => {
    const bodySchema = z.object({ name: z.string() });
    const paramsSchema = z.object({ id: z.string() });
    const querySchema = z.object({ sort: z.enum(["asc", "desc"]) });

    const res = createRes();
    const next = createNext();
    const req = createReq({ name: "John" }, { id: "c-1" }, { sort: "asc" });

    const middleware = validate({ body: bodySchema, params: paramsSchema, query: querySchema });
    middleware(req, res, next);

    expect(res.locals.body).toEqual({ name: "John" });
    expect(res.locals.params).toEqual({ id: "c-1" });
    expect(res.locals.query).toEqual({ sort: "asc" });
    expect(next).toHaveBeenCalled();
  });
});
