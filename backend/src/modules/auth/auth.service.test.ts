import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Role } from "../../generated/prisma";
import CustomError from "../../types/customError";
import { ErrorMessages } from "../../types/errorsMessages";
import { SuccessMessages } from "../../types/successMessages";
import safeUserData from "../../utils/safeUserData";
import signToken from "../../utils/signToken";
import { AuthModel } from "./auth.model";
import { AuthService } from "./auth.service";

jest.mock("./auth.model", () => ({
  AuthModel: {
    findUserByEmail: jest.fn(),
    findUserByConfirmToken: jest.fn(),
    createUser: jest.fn(),
    confirmUserEmail: jest.fn(),
    updateConfirmationToken: jest.fn(),
    updateResetPasswordOTP: jest.fn(),
    incrementOtpAttempts: jest.fn(),
    clearResetOTP: jest.fn(),
    resetOtpAttempts: jest.fn(),
    updateUserPassword: jest.fn(),
    createUserWithGoogle: jest.fn(),
    updateUserGoogleId: jest.fn(),
  },
}));

jest.mock("../../utils/signToken", () => jest.fn());
jest.mock("../../utils/safeUserData", () => jest.fn());
jest.mock("../../utils/sendEmail", () => jest.fn());
jest.mock("../../utils/createRandomOTP", () => jest.fn(() => "654321"));
jest.mock("fs", () => ({
  promises: {
    readFile: jest.fn(),
  },
}));

describe("AuthService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("signup", () => {
    it("throws when email already exists", async () => {
      (AuthModel.findUserByEmail as jest.Mock).mockResolvedValue({ id: "u-1" });

      await expect(
        AuthService.signup({
          email: "taken@example.com",
          username: "neo",
          password: "secret123",
          role: Role.STUDENT,
        }),
      ).rejects.toMatchObject<Partial<CustomError>>({
        message: ErrorMessages.EMAIL_ALREADY_EXISTS,
        statusCode: 409,
      });
    });

    it("creates a new user and returns raw confirmation token", async () => {
      const randomBytesSpy = jest.spyOn(crypto, "randomBytes").mockReturnValue(Buffer.from("token-seed") as any);
      const hashSpy = jest.spyOn(bcrypt, "hash").mockResolvedValue("hashed-password" as never);
      process.env.NODE_ENV = "test";

      (AuthModel.findUserByEmail as jest.Mock).mockResolvedValue(null);
      (AuthModel.createUser as jest.Mock).mockResolvedValue({ id: "u-2" });

      const result = await AuthService.signup({
        email: "User@Example.com",
        username: "Neo",
        password: "PlainPassword!",
        role: Role.STUDENT,
      });

      const expectedToken = Buffer.from("token-seed").toString("hex");
      const expectedTokenHash = crypto.createHash("sha256").update(expectedToken).digest("hex");

      expect(hashSpy).toHaveBeenCalledWith("PlainPassword!", 10);
      expect(AuthModel.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "user@example.com",
          username: "Neo",
          password: "hashed-password",
          role: Role.STUDENT,
          confirmEmailToken: expectedTokenHash,
          emailConfirmed: false,
        }),
      );
      expect(result).toEqual({
        confirmEmailToken: expectedToken,
        isDev: false,
      });

      randomBytesSpy.mockRestore();
    });
  });

  describe("login", () => {
    it("throws invalid credentials when user does not exist", async () => {
      (AuthModel.findUserByEmail as jest.Mock).mockResolvedValue(null);

      await expect(
        AuthService.login({
          email: "missing@example.com",
          password: "123",
        }),
      ).rejects.toMatchObject<Partial<CustomError>>({
        message: ErrorMessages.INVALID_CREDENTIALS,
        statusCode: 400,
      });
    });

    it("throws email not confirmed for valid but unconfirmed user", async () => {
      (AuthModel.findUserByEmail as jest.Mock).mockResolvedValue({
        id: "u-3",
        email: "x@example.com",
        password: "hashed",
        emailConfirmed: false,
      });
      jest.spyOn(bcrypt, "compare").mockResolvedValue(true as never);

      await expect(
        AuthService.login({
          email: "x@example.com",
          password: "pass",
        }),
      ).rejects.toMatchObject<Partial<CustomError>>({
        message: ErrorMessages.EMAIL_NOT_CONFIRMED,
        statusCode: 403,
      });
    });

    it("returns token and sanitized user on successful login", async () => {
      const user = {
        id: "u-4",
        email: "ok@example.com",
        password: "hashed",
        emailConfirmed: true,
      };

      (AuthModel.findUserByEmail as jest.Mock).mockResolvedValue(user);
      jest.spyOn(bcrypt, "compare").mockResolvedValue(true as never);
      (signToken as jest.Mock).mockReturnValue("jwt-token");
      (safeUserData as jest.Mock).mockReturnValue({ id: "u-4", email: "ok@example.com" });

      const result = await AuthService.login({
        email: "ok@example.com",
        password: "pass",
      });

      expect(signToken).toHaveBeenCalledWith("u-4");
      expect(safeUserData).toHaveBeenCalledWith(user);
      expect(result).toEqual({
        token: "jwt-token",
        user: { id: "u-4", email: "ok@example.com" },
      });
    });
  });

  describe("verifyOTP", () => {
    it("increments attempts and throws on invalid otp", async () => {
      const storedOtp = crypto.createHash("sha256").update("654321").digest("hex");

      (AuthModel.findUserByEmail as jest.Mock).mockResolvedValue({
        id: "u-5",
        email: "otp@example.com",
        otpAttempts: 0,
        resetPasswordOTP: storedOtp,
        resetPasswordExpires: new Date(Date.now() + 60_000),
      });

      await expect(
        AuthService.verifyOTP({
          email: "otp@example.com",
          otp: "111111",
        }),
      ).rejects.toMatchObject<Partial<CustomError>>({
        message: ErrorMessages.INVALID_OTP,
        statusCode: 400,
      });

      expect(AuthModel.incrementOtpAttempts).toHaveBeenCalledWith("u-5");
    });

    it("clears otp and resets attempts on valid otp", async () => {
      const otp = "123456";
      const storedOtp = crypto.createHash("sha256").update(otp).digest("hex");

      (AuthModel.findUserByEmail as jest.Mock).mockResolvedValue({
        id: "u-6",
        email: "otp2@example.com",
        otpAttempts: 0,
        resetPasswordOTP: storedOtp,
        resetPasswordExpires: new Date(Date.now() + 60_000),
      });

      const result = await AuthService.verifyOTP({
        email: "otp2@example.com",
        otp,
      });

      expect(AuthModel.clearResetOTP).toHaveBeenCalledWith("u-6");
      expect(AuthModel.resetOtpAttempts).toHaveBeenCalledWith("u-6");
      expect(result).toEqual({
        success: true,
        message: SuccessMessages.OTP_VERIFIED,
      });
    });
  });

  describe("confirmEmail", () => {
    it("throws invalid token error when user not found", async () => {
      (AuthModel.findUserByConfirmToken as jest.Mock).mockResolvedValue(null);

      await expect(AuthService.confirmEmail({ token: "invalid-token" })).rejects.toMatchObject({
        message: ErrorMessages.INVALID_TOKEN,
        statusCode: 400,
      });
    });

    it("confirms email and returns success html", async () => {
      const fs = require("fs").promises;
      const htmlContent = "<html>Email Verified Successfully</html>";
      fs.readFile.mockResolvedValue(htmlContent);
      (AuthModel.findUserByConfirmToken as jest.Mock).mockResolvedValue({ id: "u-7" });
      (AuthModel.confirmUserEmail as jest.Mock).mockResolvedValue({ emailConfirmed: true });

      const result = await AuthService.confirmEmail({ token: "valid-token" });

      expect(AuthModel.confirmUserEmail).toHaveBeenCalledWith("u-7");
      expect(result).toEqual(htmlContent);
      expect(fs.readFile).toHaveBeenCalled();
    });
  });

  describe("resendConfirmationEmail", () => {
    it("throws when user not found", async () => {
      (AuthModel.findUserByEmail as jest.Mock).mockResolvedValue(null);

      await expect(AuthService.resendConfirmationEmail({ email: "missing@example.com" })).rejects.toMatchObject({
        message: ErrorMessages.USER_NOT_FOUND,
        statusCode: 404,
      });
    });

    it("throws when email already confirmed", async () => {
      (AuthModel.findUserByEmail as jest.Mock).mockResolvedValue({ id: "u-8", emailConfirmed: true });

      await expect(AuthService.resendConfirmationEmail({ email: "confirmed@example.com" })).rejects.toMatchObject({
        message: ErrorMessages.EMAIL_ALREADY_CONFIRMED,
        statusCode: 400,
      });
    });

    it("sends new confirmation email", async () => {
      const fs = require("fs").promises;
      fs.readFile.mockResolvedValue("Confirm your email: %%CONFIRMATION_LINK%%");
      (AuthModel.findUserByEmail as jest.Mock).mockResolvedValue({ id: "u-9", emailConfirmed: false });
      (AuthModel.updateConfirmationToken as jest.Mock).mockResolvedValue({});

      const result = await AuthService.resendConfirmationEmail({ email: "unconfirmed@example.com" });

      expect(AuthModel.updateConfirmationToken).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });
  });

  describe("forgotPassword", () => {
    it("throws when user not found", async () => {
      (AuthModel.findUserByEmail as jest.Mock).mockResolvedValue(null);

      await expect(AuthService.forgotPassword({ email: "notfound@example.com" })).rejects.toMatchObject({
        message: ErrorMessages.USER_NOT_FOUND,
        statusCode: 404,
      });
    });

    it("sends password reset email", async () => {
      const fs = require("fs").promises;
      fs.readFile.mockResolvedValue("Your OTP is: %%OTP%%");
      (AuthModel.findUserByEmail as jest.Mock).mockResolvedValue({ id: "u-10", email: "reset@example.com" });
      (AuthModel.updateResetPasswordOTP as jest.Mock).mockResolvedValue({});

      const result = await AuthService.forgotPassword({ email: "reset@example.com" });

      expect(AuthModel.updateResetPasswordOTP).toHaveBeenCalled();
      expect(result).toEqual({ message: SuccessMessages.PASSWORD_RESET_EMAIL_SENT });
    });
  });

  describe("resetPassword", () => {
    it("throws when user not found", async () => {
      (AuthModel.findUserByEmail as jest.Mock).mockResolvedValue(null);

      await expect(
        AuthService.resetPassword({ email: "notfound@example.com", otp: "123456", newPassword: "pass" }),
      ).rejects.toMatchObject({
        message: ErrorMessages.USER_NOT_FOUND,
        statusCode: 404,
      });
    });

    it("throws when otp is missing", async () => {
      (AuthModel.findUserByEmail as jest.Mock).mockResolvedValue({ id: "u-11", resetPasswordOTP: null });

      await expect(
        AuthService.resetPassword({ email: "reset@example.com", otp: "123456", newPassword: "pass" }),
      ).rejects.toMatchObject({
        message: ErrorMessages.NO_OTP_REQUEST_FOUND,
        statusCode: 400,
      });
    });

    it("throws when too many otp attempts", async () => {
      (AuthModel.findUserByEmail as jest.Mock).mockResolvedValue({
        id: "u-12",
        resetPasswordOTP: "hash",
        otpAttempts: 5,
      });

      await expect(
        AuthService.resetPassword({ email: "reset@example.com", otp: "123456", newPassword: "pass" }),
      ).rejects.toMatchObject({
        message: ErrorMessages.TOO_MANY_OTP_ATTEMPTS,
        statusCode: 429,
      });
    });

    it("resets password on valid otp", async () => {
      const otp = "654321";
      const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
      jest.spyOn(bcrypt, "hash").mockResolvedValue("new-hash" as never);

      (AuthModel.findUserByEmail as jest.Mock).mockResolvedValue({
        id: "u-13",
        resetPasswordOTP: otpHash,
        otpAttempts: 0,
        resetPasswordExpires: new Date(Date.now() + 60_000),
      });

      const result = await AuthService.resetPassword({
        email: "reset@example.com",
        otp,
        newPassword: "newpass123",
      });

      expect(AuthModel.updateUserPassword).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: SuccessMessages.PASSWORD_RESET_SUCCESSFULLY,
      });
    });
  });

  describe("verifyOTP - error cases", () => {
    it("throws when no otp request", async () => {
      (AuthModel.findUserByEmail as jest.Mock).mockResolvedValue({
        id: "u-14",
        emailConfirmed: false,
        resetPasswordOTP: null,
      });

      await expect(AuthService.verifyOTP({ email: "nootp@example.com", otp: "123456" })).rejects.toMatchObject({
        message: ErrorMessages.NO_OTP_REQUEST_FOUND,
        statusCode: 400,
      });
    });

    it("throws when too many attempts", async () => {
      (AuthModel.findUserByEmail as jest.Mock).mockResolvedValue({
        id: "u-15",
        resetPasswordOTP: "somehash",
        otpAttempts: 5,
      });

      await expect(AuthService.verifyOTP({ email: "toomany@example.com", otp: "123456" })).rejects.toMatchObject({
        message: ErrorMessages.TOO_MANY_OTP_ATTEMPTS,
        statusCode: 429,
      });
    });

    it("throws when otp expired", async () => {
      const storedOtp = crypto.createHash("sha256").update("correct").digest("hex");
      (AuthModel.findUserByEmail as jest.Mock).mockResolvedValue({
        id: "u-16",
        resetPasswordOTP: storedOtp,
        otpAttempts: 0,
        resetPasswordExpires: new Date(Date.now() - 60_000), // Expired
      });

      await expect(AuthService.verifyOTP({ email: "expired@example.com", otp: "correct" })).rejects.toMatchObject({
        message: ErrorMessages.OTP_EXPIRED,
        statusCode: 400,
      });
    });
  });
});
