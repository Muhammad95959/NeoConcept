import prisma from "../../config/db";
import { Role, User } from "../../generated/prisma";

export class AuthModel {
  static async findUserById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id, deletedAt: null } });
  }

  static async findUserByEmail(email: string) {
    return prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
  }

  static async findUserByConfirmToken(tokenHash: string) {
    return prisma.user.findFirst({
      where: {
        confirmEmailToken: tokenHash,
        confirmEmailExpires: { gt: new Date() },
        deletedAt: null,
      },
    });
  }

  static async createUser(data: {
    email: string;
    username: string;
    password: string;
    role: Role;
    emailConfirmed: boolean;
    confirmEmailToken?: string | null;
    confirmEmailExpires?: Date | null;
  }) {
    return prisma.user.create({ data });
  }

  static async createUserWithGoogle(email: string, username: string, googleId: string, role: Role) {
    return prisma.user.create({
      data: { email, username, googleId, emailConfirmed: true, role },
    });
  }

  static async confirmUserEmail(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        emailConfirmed: true,
        confirmEmailToken: null,
        confirmEmailExpires: null,
      },
    });
  }

  static async updateConfirmationToken(userId: string, tokenHash: string, expires: Date) {
    return prisma.user.update({
      where: { id: userId },
      data: { confirmEmailToken: tokenHash, confirmEmailExpires: expires },
    });
  }

  static async updateResetPasswordOTP(userId: string, otpHash: string, expires: Date) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        resetPasswordOTP: otpHash,
        resetPasswordExpires: expires,
        otpAttempts: 0,
      },
    });
  }

  static async updateUserPassword(userId: string, hashedPassword: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        passwordChangedAt: new Date(),
      },
    });
  }

  static async updateUserGoogleId(userId: string, googleId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { googleId, emailConfirmed: true },
    });
  }

  static async incrementOtpAttempts(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        otpAttempts: { increment: 1 },
      },
    });
  }

  static async resetOtpAttempts(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        otpAttempts: 0,
      },
    });
  }

  static async clearResetOTP(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        resetPasswordOTP: null,
        resetPasswordExpires: null,
      },
    });
  }

  static transaction(callback: any) {
    return prisma.$transaction(callback);
  }
}
