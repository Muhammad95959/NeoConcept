import { Request, Response, NextFunction } from "express";
import { protect } from "../protect";
import { verifyToken } from "../../utils/verifyToken";
import { HTTPStatusText } from "../../types/HTTPStatusText";

jest.mock("../../utils/verifyToken", () => ({
  verifyToken: jest.fn(),
}));

describe("protect middleware", () => {
  const createRes = () => {
    const res = {
      locals: {},
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
    return res;
  };

  const createReq = (headers?: any, cookies?: any) => ({
    headers: headers || {},
    cookies: cookies || {},
  } as unknown as Request);

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("extracts Bearer token and sets user on success", async () => {
    const res = createRes();
    const next = jest.fn() as NextFunction;
    const req = createReq({ authorization: "Bearer token-abc" });
    const user = { id: "u-1", email: "test@example.com" };

    (verifyToken as jest.Mock).mockResolvedValue(user);

    await protect(req, res, next);

    expect(verifyToken).toHaveBeenCalledWith("token-abc");
    expect(res.locals.user).toEqual(user);
    expect(next).toHaveBeenCalled();
  });

  it("extracts JWT from cookies when Bearer token missing", async () => {
    const res = createRes();
    const next = jest.fn() as NextFunction;
    const req = createReq({}, { jwt: "token-from-cookie" });
    const user = { id: "u-2" };

    (verifyToken as jest.Mock).mockResolvedValue(user);

    await protect(req, res, next);

    expect(verifyToken).toHaveBeenCalledWith("token-from-cookie");
    expect(res.locals.user).toEqual(user);
    expect(next).toHaveBeenCalled();
  });

  it("returns 401 when token verification fails", async () => {
    const res = createRes();
    const next = jest.fn() as NextFunction;
    const req = createReq({ authorization: "Bearer bad-token" });
    const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => undefined);

    (verifyToken as jest.Mock).mockRejectedValue({
      statusCode: 401,
      message: "Invalid token",
    });

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      status: HTTPStatusText.FAIL,
      message: "Invalid token",
    });
    expect(next).not.toHaveBeenCalled();

    consoleLogSpy.mockRestore();
  });

  it("returns 401 when no token provided", async () => {
    const res = createRes();
    const next = jest.fn() as NextFunction;
    const req = createReq();
    const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => undefined);

    (verifyToken as jest.Mock).mockRejectedValue({
      statusCode: 401,
      message: "No token",
    });

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();

    consoleLogSpy.mockRestore();
  });
});
