import { Request, Response } from "express";
import { errorHandler } from "../errorHandler";
import { ErrorMessages } from "../../types/errorsMessages";
import { HTTPStatusText } from "../../types/HTTPStatusText";

describe("errorHandler", () => {
  const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  const createRes = () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    return res;
  };

  it("handles Zod errors with combined message", () => {
    const res = createRes();
    const err = {
      name: "ZodError",
      errors: [
        { path: ["email"], message: "Invalid email" },
        { path: ["password"], message: "Too short" },
      ],
    };

    errorHandler(err, {} as Request, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: HTTPStatusText.FAIL,
      message: "email: Invalid email, password: Too short",
    });
  });

  it("handles jwt errors as invalid token", () => {
    const res = createRes();
    const err = { name: "JsonWebTokenError" };

    errorHandler(err, {} as Request, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      status: HTTPStatusText.FAIL,
      message: ErrorMessages.INVALID_TOKEN,
    });
  });

  it("falls back to defaults for unknown errors", () => {
    const res = createRes();

    errorHandler({}, {} as Request, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      status: HTTPStatusText.ERROR,
      message: "Internal Server Error",
    });
  });
});
