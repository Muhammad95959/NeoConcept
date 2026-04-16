import { Role } from "../../../generated/prisma";
import prisma from "../../../config/db";
import { AuthModel } from "../auth.model";

jest.mock("../../config/db", () => ({
  __esModule: true,
  default: {
    user: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

describe("AuthModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("findUserByEmail", () => {
    it("queries active user by email", async () => {
      const user = { id: "u-1", email: "neo@example.com", deletedAt: null };
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(user);

      const result = await AuthModel.findUserByEmail("neo@example.com");

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { email: "neo@example.com", deletedAt: null },
      });
      expect(result).toEqual(user);
    });
  });

  describe("createUser", () => {
    it("creates a user with provided data", async () => {
      const data = {
        email: "neo@example.com",
        username: "Neo",
        password: "hashed",
        role: Role.STUDENT,
        emailConfirmed: false,
        confirmEmailToken: "token-hash",
        confirmEmailExpires: new Date("2026-01-01T00:00:00.000Z"),
      };
      (prisma.user.create as jest.Mock).mockResolvedValue({ id: "u-2", ...data });

      const result = await AuthModel.createUser(data);

      expect(prisma.user.create).toHaveBeenCalledWith({ data });
      expect(result).toEqual({ id: "u-2", ...data });
    });
  });

  describe("findUserByConfirmToken", () => {
    it("looks up user by token hash and non-expired timestamp", async () => {
      const user = { id: "u-3" };
      const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(user);

      const result = await AuthModel.findUserByConfirmToken("token-hash");

      expect(prisma.user.findMany).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith([]);
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          confirmEmailToken: "token-hash",
          confirmEmailExpires: {
            gt: expect.any(Date),
          },
        },
      });
      expect(result).toEqual(user);
      consoleSpy.mockRestore();
    });
  });

  describe("confirmUserEmail", () => {
    it("marks email confirmed and clears confirmation token fields", async () => {
      const updated = { id: "u-4", emailConfirmed: true };
      (prisma.user.update as jest.Mock).mockResolvedValue(updated);

      const result = await AuthModel.confirmUserEmail("u-4");

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "u-4" },
        data: {
          emailConfirmed: true,
          confirmEmailToken: null,
          confirmEmailExpires: null,
        },
      });
      expect(result).toEqual(updated);
    });
  });

  describe("updateConfirmationToken", () => {
    it("updates user confirmation token and expiry", async () => {
      const expires = new Date("2026-02-01T00:00:00.000Z");
      (prisma.user.update as jest.Mock).mockResolvedValue({ id: "u-5" });

      await AuthModel.updateConfirmationToken("u-5", "new-token-hash", expires);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "u-5" },
        data: { confirmEmailToken: "new-token-hash", confirmEmailExpires: expires },
      });
    });
  });

  describe("updateResetPasswordOTP", () => {
    it("stores otp hash, expiry, and resets attempts", async () => {
      const expires = new Date("2026-03-01T00:00:00.000Z");
      (prisma.user.update as jest.Mock).mockResolvedValue({ id: "u-6" });

      await AuthModel.updateResetPasswordOTP("u-6", "otp-hash", expires);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "u-6" },
        data: {
          resetPasswordOTP: "otp-hash",
          resetPasswordExpires: expires,
          otpAttempts: 0,
        },
      });
    });
  });

  describe("incrementOtpAttempts", () => {
    it("increments otpAttempts by 1", async () => {
      (prisma.user.update as jest.Mock).mockResolvedValue({ id: "u-7" });

      await AuthModel.incrementOtpAttempts("u-7");

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "u-7" },
        data: {
          otpAttempts: { increment: 1 },
        },
      });
    });
  });

  describe("resetOtpAttempts", () => {
    it("resets otpAttempts to 0", async () => {
      (prisma.user.update as jest.Mock).mockResolvedValue({ id: "u-8" });

      await AuthModel.resetOtpAttempts("u-8");

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "u-8" },
        data: {
          otpAttempts: 0,
        },
      });
    });
  });

  describe("clearResetOTP", () => {
    it("clears reset otp and expiry", async () => {
      (prisma.user.update as jest.Mock).mockResolvedValue({ id: "u-9" });

      await AuthModel.clearResetOTP("u-9");

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "u-9" },
        data: {
          resetPasswordOTP: null,
          resetPasswordExpires: null,
        },
      });
    });
  });

  describe("updateUserPassword", () => {
    it("updates password and sets passwordChangedAt", async () => {
      (prisma.user.update as jest.Mock).mockResolvedValue({ id: "u-10" });

      await AuthModel.updateUserPassword("u-10", "new-hash");

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "u-10" },
        data: {
          password: "new-hash",
          passwordChangedAt: expect.any(Date),
        },
      });
    });
  });

  describe("findUserById", () => {
    it("returns user by id", async () => {
      const user = { id: "u-11", email: "user@example.com" };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);

      const result = await AuthModel.findUserById("u-11");

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: "u-11" } });
      expect(result).toEqual(user);
    });
  });

  describe("createUserWithGoogle", () => {
    it("creates user with google id and confirmed email", async () => {
      (prisma.user.create as jest.Mock).mockResolvedValue({ id: "u-12" });

      await AuthModel.createUserWithGoogle("g@example.com", "GUser", "gid-123", Role.INSTRUCTOR);

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: "g@example.com",
          username: "GUser",
          googleId: "gid-123",
          emailConfirmed: true,
          role: Role.INSTRUCTOR,
        },
      });
    });
  });

  describe("updateUserGoogleId", () => {
    it("updates google id and confirms email", async () => {
      (prisma.user.update as jest.Mock).mockResolvedValue({ id: "u-13" });

      await AuthModel.updateUserGoogleId("u-13", "gid-999");

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "u-13" },
        data: { googleId: "gid-999", emailConfirmed: true },
      });
    });
  });

  describe("transaction", () => {
    it("delegates to prisma transaction", async () => {
      const callback = jest.fn();
      (prisma.$transaction as jest.Mock).mockResolvedValue("tx-result");

      const result = await AuthModel.transaction(callback);

      expect(prisma.$transaction).toHaveBeenCalledWith(callback);
      expect(result).toBe("tx-result");
    });
  });
});
