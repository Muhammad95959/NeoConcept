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
    createUser: jest.fn(),
    incrementOtpAttempts: jest.fn(),
    clearResetOTP: jest.fn(),
    resetOtpAttempts: jest.fn(),
  },
}));

jest.mock("../../utils/signToken", () => jest.fn());
jest.mock("../../utils/safeUserData", () => jest.fn());

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
      const randomBytesSpy = jest.spyOn(crypto, "randomBytes").mockReturnValue(Buffer.from("token-seed"));
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
});