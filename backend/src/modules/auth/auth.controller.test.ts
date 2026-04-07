import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { sendConfirmationEmail } from "./email.service";
import { HTTPStatusText } from "../../types/HTTPStatusText";
import { SuccessMessages } from "../../types/successMessages";
import { Constants } from "../../types/constants";
import safeUserData from "../../utils/safeUserData";

jest.mock("./auth.service", () => ({
  AuthService: {
    signup: jest.fn(),
    confirmEmail: jest.fn(),
    login: jest.fn(),
    forgotPassword: jest.fn(),
    verifyOTP: jest.fn(),
    resetPassword: jest.fn(),
    mobileGoogleAuth: jest.fn(),
  },
}));

jest.mock("./email.service", () => ({
  sendConfirmationEmail: jest.fn(),
}));

jest.mock("../../utils/safeUserData", () => jest.fn());

const createMockRes = () => {
  const res: Partial<Response> = {
    locals: {},
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
  };

  return res as Response;
};

describe("AuthController", () => {
  const next = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("signup sends confirmation email in non-dev mode", async () => {
    const req = { body: { email: "neo@example.com" } } as Request;
    const res = createMockRes();

    (AuthService.signup as jest.Mock).mockResolvedValue({
      confirmEmailToken: "confirm-token",
      isDev: false,
    });

    await AuthController.signup(req, res, next);

    expect(sendConfirmationEmail).toHaveBeenCalledWith("neo@example.com", "confirm-token", req);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      status: HTTPStatusText.SUCCESS,
      message: SuccessMessages.CONFIRM_EMAIL,
    });
  });

  it("signup skips confirmation email in dev mode", async () => {
    const req = { body: { email: "neo@example.com" } } as Request;
    const res = createMockRes();

    (AuthService.signup as jest.Mock).mockResolvedValue({
      confirmEmailToken: "confirm-token",
      isDev: true,
    });

    await AuthController.signup(req, res, next);

    expect(sendConfirmationEmail).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      status: HTTPStatusText.SUCCESS,
      message: SuccessMessages.DEV_SIGNUP,
    });
  });

  it("confirmEmail returns html on success", async () => {
    const req = {} as Request;
    const res = createMockRes();
    res.locals = { params: { token: "abc" } };

    (AuthService.confirmEmail as jest.Mock).mockResolvedValue("<html>ok</html>");

    await AuthController.confirmEmail(req, res, next);

    expect(AuthService.confirmEmail).toHaveBeenCalledWith({ token: "abc" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith("<html>ok</html>");
  });

  it("confirmEmail sends fallback html error response when error has html", async () => {
    const req = {} as Request;
    const res = createMockRes();
    res.locals = { params: { token: "abc" } };

    (AuthService.confirmEmail as jest.Mock).mockRejectedValue({ html: "<html>fail</html>", status: 422 });

    await AuthController.confirmEmail(req, res, next);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.send).toHaveBeenCalledWith("<html>fail</html>");
    expect(next).not.toHaveBeenCalled();
  });

  it("login sets auth cookie and returns token/data", async () => {
    const previousNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = Constants.PRODUCTION;

    const req = {} as Request;
    const res = createMockRes();
    res.locals = { body: { email: "neo@example.com", password: "pass" } };
    (AuthService.login as jest.Mock).mockResolvedValue({ token: "jwt-token", user: { id: "u-1" } });

    await AuthController.login(req, res, next);

    expect(res.cookie).toHaveBeenCalledWith("jwt", "jwt-token", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: HTTPStatusText.SUCCESS,
      token: "jwt-token",
      data: { id: "u-1" },
    });

    process.env.NODE_ENV = previousNodeEnv;
  });

  it("forgotPassword returns success payload", async () => {
    const req = { body: { email: "neo@example.com" } } as Request;
    const res = createMockRes();

    (AuthService.forgotPassword as jest.Mock).mockResolvedValue({ message: SuccessMessages.PASSWORD_RESET_EMAIL_SENT });

    await AuthController.forgotPassword(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      status: HTTPStatusText.SUCCESS,
      message: SuccessMessages.PASSWORD_RESET_EMAIL_SENT,
    });
  });

  it("verifyOTP returns success response", async () => {
    const req = {} as Request;
    const res = createMockRes();
    res.locals = { body: { email: "neo@example.com", otp: "123456" } };

    (AuthService.verifyOTP as jest.Mock).mockResolvedValue({ message: SuccessMessages.OTP_VERIFIED });

    await AuthController.verifyOTP(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: HTTPStatusText.SUCCESS,
      message: SuccessMessages.OTP_VERIFIED,
    });
  });

  it("logout clears cookie", () => {
    const req = {} as Request;
    const res = createMockRes();

    AuthController.logout(req, res);

    expect(res.clearCookie).toHaveBeenCalledWith("jwt");
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("authorize returns safe user data", () => {
    const req = {} as Request;
    const res = createMockRes();
    res.locals = { user: { id: "u-10", password: "secret" } };

    (safeUserData as jest.Mock).mockReturnValue({ id: "u-10" });

    AuthController.authorize(req, res);

    expect(safeUserData).toHaveBeenCalledWith({ id: "u-10", password: "secret" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: HTTPStatusText.SUCCESS,
      data: { id: "u-10" },
    });
  });

  it("mobileGoogleAuth forwards errors to next", async () => {
    const req = {} as Request;
    const res = createMockRes();
    const error = new Error("google failure");
    res.locals = { body: { idToken: "x" }, query: { role: "student" } };

    (AuthService.mobileGoogleAuth as jest.Mock).mockRejectedValue(error);

    await AuthController.mobileGoogleAuth(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});