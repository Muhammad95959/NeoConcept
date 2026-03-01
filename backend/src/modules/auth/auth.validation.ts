import { z } from "zod";
import { Role } from "../../generated/prisma";

export class AuthValidationSchemas {
  static RoleEnum = z.enum(["STUDENT", "INSTRUCTOR", "ASSISTANT", "ADMIN"]);

  static signup = z.object({
    email: z
      .string()
      .min(1, "Email is required")
      .email("Invalid email format")
      .transform((val) => val.toLowerCase()),

    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username must be less than 30 characters"),

    password: z.string().min(6, "Password must be at least 6 characters"),

    role: z.nativeEnum(Role),
  });

  static confirmEmail = z.object({
    token: z.string().min(1),
  });

  static resendConfirmationEmail = z.object({
    email: z.string().email("Invalid email address"),
  });

  static login = z.object({
    body: z.object({
      email: z.string().email("Invalid email").toLowerCase(),
      password: z.string().min(1, "Password is required"),
    }),
  });

  static forgotPassword = z.object({
    email: z.string().email("Invalid email address").toLowerCase(),
  });

  static verifyOTP = z.object({
    body: z.object({
      email: z.string().email(),
      otp: z.string().length(6),
    }),
  });

  static resetPassword = z.object({
    email: z.string().email("Invalid email"),
    otp: z.string().length(6, "OTP must be 6 digits"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
  });

  static mobileGoogleAuth = z.object({
    body: z.object({
      idToken: z.string().nonempty("idToken is required"),
    }),
    query: z.object({
      role: z.string().optional(),
    }),
  });
}

export type SignupInput = z.infer<typeof AuthValidationSchemas.signup>;
export type ConfirmEmailInput = z.infer<typeof AuthValidationSchemas.confirmEmail>;
export type ResendConfirmationEmailInput = z.infer<typeof AuthValidationSchemas.resendConfirmationEmail>;
export type LoginInput = z.infer<typeof AuthValidationSchemas.login>["body"];
export type ForgotPasswordInput = z.infer<typeof AuthValidationSchemas.forgotPassword>;
export type VerifyOTPInput = z.infer<typeof AuthValidationSchemas.verifyOTP>["body"];
export type ResetPasswordInput = z.infer<typeof AuthValidationSchemas.resetPassword>;
export type MobileGoogleAuthInput = z.infer<typeof AuthValidationSchemas.mobileGoogleAuth>["body"];
export type MobileGoogleAuthQuery = z.infer<typeof AuthValidationSchemas.mobileGoogleAuth>["query"];
