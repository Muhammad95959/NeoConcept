import { Request, Response, NextFunction } from "express";
import { Role } from "../../generated/prisma/client";
import { restrict } from "../restrict";
import { HTTPStatusText } from "../../types/HTTPStatusText";
import { ErrorMessages } from "../../types/errorsMessages";

describe("restrict middleware", () => {
  const createRes = (user?: any) => ({
    locals: { user },
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as unknown as Response);

  const createReq = () => ({} as unknown as Request);

  it("allows user with matching role", () => {
    const next = jest.fn() as NextFunction;
    const res = createRes({ id: "u-1", role: Role.INSTRUCTOR });
    const req = createReq();

    const middleware = restrict(Role.INSTRUCTOR, Role.ADMIN);
    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("returns 403 when user role not in allowed roles", () => {
    const next = jest.fn() as NextFunction;
    const res = createRes({ id: "u-2", role: Role.STUDENT });
    const req = createReq();

    const middleware = restrict(Role.INSTRUCTOR);
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      status: HTTPStatusText.FAIL,
      message: ErrorMessages.DONT_HAVE_PERMISSION_TO_PERFORM_THIS_ACTION,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when user is not logged in", () => {
    const next = jest.fn() as NextFunction;
    const res = createRes(undefined);
    const req = createReq();

    const middleware = restrict(Role.INSTRUCTOR);
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      status: HTTPStatusText.FAIL,
      message: ErrorMessages.NOT_LOGIN_YET,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("allows multiple role checks", () => {
    const next = jest.fn() as NextFunction;
    const res = createRes({ id: "u-3", role: Role.ASSISTANT });
    const req = createReq();

    const middleware = restrict(Role.INSTRUCTOR, Role.ASSISTANT, Role.ADMIN);
    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
