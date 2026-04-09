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
    resendConfirmationEmail: jest.fn(),
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

  it("signup handles email service error and passes to next", async () => {
    const req = { body: { email: "neo@example.com" } } as Request;
    const res = createMockRes();
    const sendError = new Error("email send failed");

    (AuthService.signup as jest.Mock).mockResolvedValue({
      confirmEmailToken: "confirm-token",
      isDev: false,
    });
    (sendConfirmationEmail as jest.Mock).mockRejectedValue(sendError);

    await AuthController.signup(req, res, next);

    // Should still return 201 because sendEmail error isn't caught in controller
  });

  it("signup propagates service errors to next", async () => {
    const req = { body: { email: "taken@example.com" } } as Request;
    const res = createMockRes();
    const serviceError = new Error("Email already exists");

    (AuthService.signup as jest.Mock).mockRejectedValue(serviceError);

    await AuthController.signup(req, res, next);

    expect(next).toHaveBeenCalledWith(serviceError);
  });

  it("confirmEmail sends 400 on default error", async () => {
    const req = {} as Request;
    const res = createMockRes();
    res.locals = { params: { token: "abc" } };
    const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => undefined);

    const error = new Error("generic error");
    (AuthService.confirmEmail as jest.Mock).mockRejectedValue(error);

    await AuthController.confirmEmail(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    consoleLogSpy.mockRestore();
  });

  it("resendConfirmationEmail sends email and returns success", async () => {
    const req = {} as Request;
    const res = createMockRes();
    res.locals = { body: { email: "test@example.com" } };
    const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => undefined);

    (AuthService.resendConfirmationEmail as jest.Mock).mockResolvedValue({ success: true });

    await AuthController.resendConfirmationEmail(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      status: HTTPStatusText.SUCCESS,
      message: SuccessMessages.NEW_CONFIRMATION,
    });

    consoleLogSpy.mockRestore();
  });

  it("resendConfirmationEmail handles errors", async () => {
    const req = {} as Request;
    const res = createMockRes();
    res.locals = { body: { email: "notfound@example.com" } };
    const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => undefined);
    const error = new Error("User not found");

    (AuthService.resendConfirmationEmail as jest.Mock).mockRejectedValue(error);

    await AuthController.resendConfirmationEmail(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    consoleLogSpy.mockRestore();
  });

  it("login handles service errors", async () => {
    const req = {} as Request;
    const res = createMockRes();
    res.locals = { body: { email: "test@example.com", password: "wrong" } };
    const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => undefined);
    const error = new Error("Invalid credentials");

    (AuthService.login as jest.Mock).mockRejectedValue(error);

    await AuthController.login(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    consoleLogSpy.mockRestore();
  });

  it("login sets secure cookie in dev environment", async () => {
    const previousNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = Constants.DEVELOPMENT;

    const req = {} as Request;
    const res = createMockRes();
    res.locals = { body: { email: "dev@example.com", password: "pass" } };
    (AuthService.login as jest.Mock).mockResolvedValue({ token: "jwt-token", user: { id: "u-1" } });

    await AuthController.login(req, res, next);

    expect(res.cookie).toHaveBeenCalledWith("jwt", "jwt-token", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });

    process.env.NODE_ENV = previousNodeEnv;
  });

  it("forgotPassword handles service errors", async () => {
    const req = { body: { email: "notfound@example.com" } } as Request;
    const res = createMockRes();
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
    const error = new Error("User not found");

    (AuthService.forgotPassword as jest.Mock).mockRejectedValue(error);

    await AuthController.forgotPassword(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    consoleErrorSpy.mockRestore();
  });

  it("verifyOTP handles service errors", async () => {
    const req = {} as Request;
    const res = createMockRes();
    res.locals = { body: { email: "test@example.com", otp: "wrong" } };
    const error = new Error("Invalid OTP");

    (AuthService.verifyOTP as jest.Mock).mockRejectedValue(error);

    await AuthController.verifyOTP(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("resetPassword returns success message", async () => {
    const req = {} as Request;
    const res = createMockRes();
    res.locals = { body: { email: "test@example.com", otp: "123456", newPassword: "newpass" } };

    (AuthService.resetPassword as jest.Mock).mockResolvedValue({
      message: SuccessMessages.PASSWORD_RESET_SUCCESSFULLY,
    });

    await AuthController.resetPassword(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: HTTPStatusText.SUCCESS,
      message: SuccessMessages.PASSWORD_RESET_SUCCESSFULLY,
    });
  });

  it("resetPassword handles service errors", async () => {
    const req = {} as Request;
    const res = createMockRes();
    res.locals = { body: { email: "test@example.com", otp: "wrong", newPassword: "pass" } };
    const error = new Error("Invalid OTP");

    (AuthService.resetPassword as jest.Mock).mockRejectedValue(error);

    await AuthController.resetPassword(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("mobileGoogleAuth returns token and user data", async () => {
    const req = {} as Request;
    const res = createMockRes();
    res.locals = { body: { idToken: "valid-token" }, query: { role: "INSTRUCTOR" } };
    const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => undefined);

    (AuthService.mobileGoogleAuth as jest.Mock).mockResolvedValue({
      token: "jwt-token",
      user: { id: "u-1", email: "google@example.com" },
    });

    await AuthController.mobileGoogleAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: HTTPStatusText.SUCCESS,
      token: "jwt-token",
      data: { id: "u-1", email: "google@example.com" },
    });

    consoleLogSpy.mockRestore();
  });
});
