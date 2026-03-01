import { Role } from "../../generated/prisma/client";
import { NextFunction, Request, Response } from "express";
import safeUserData from "../../utils/safeUserData";
import { sendConfirmationEmail } from "./email.service";
import { AuthService } from "./auth.service";
import { HttpStatusText } from "../../types/HTTPStatusText";
import {
  ConfirmEmailInput,
  ForgotPasswordInput,
  LoginInput,
  MobileGoogleAuthInput,
  MobileGoogleAuthQuery,
  ResendConfirmationEmailInput,
  ResetPasswordInput,
  VerifyOTPInput,
} from "./auth.validation";

export class AuthController {
  static async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const { confirmEmailToken, isDev } = await AuthService.signup(req.body);

      if (!isDev) {
        await sendConfirmationEmail(req.body.email, confirmEmailToken, req);
      }

      res.status(201).json({
        status: HttpStatusText.SUCCESS,
        message: isDev
          ? "api is running on development mode => email created & confirmed"
          : "Please confirm your email",
      });
    } catch (err: any) {
      console.log(err.message);
      next(err);
    }
  }

  static async confirmEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.validated!.params as ConfirmEmailInput;
      const html = await AuthService.confirmEmail({ token });

      res.status(200).send(html);
    } catch (err: any) {
      console.log(err);
      if (err.html) return res.status(err.status || 400).send(err.html);
      next(err);
    }
  }

  static async resendConfirmationEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.validated!.body as ResendConfirmationEmailInput;

      await AuthService.resendConfirmationEmail({email});

      res.status(201).json({
        status: HttpStatusText.SUCCESS,
        message: "New confirmation email was sent successfully",
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data = req.validated!.body as LoginInput;
      const { token, user } = await AuthService.login(data);

      res.cookie("jwt", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      });

      res.status(200).json({
        status: HttpStatusText.SUCCESS,
        token,
        data: user,
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body as ForgotPasswordInput;

      const result = await AuthService.forgotPassword({email});

      res.status(201).json({
        status: HttpStatusText.SUCCESS,
        ...result,
      });
    } catch (err: any) {
      console.error(err.message);
      next(err);
    }
  }

  static async verifyOTP(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otp } = req.validated!.body as VerifyOTPInput;

      const result = await AuthService.verifyOTP({email, otp});

      res.status(200).json({
        status: HttpStatusText.SUCCESS,
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otp, newPassword } = req.validated!.body as ResetPasswordInput;

      const result = await AuthService.resetPassword({ email, otp, newPassword });

      res.status(200).json({
        status: HttpStatusText.SUCCESS,
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  }

  static logout(_req: Request, res: Response) {
    res.clearCookie("jwt");
    res.status(200).json({
      status: HttpStatusText.SUCCESS,
      message: "Logged out successfully",
    });
  }

  static authorize(_req: Request, res: Response) {
    res.status(200).json({
      status: HttpStatusText.SUCCESS,
      data: safeUserData(res.locals.user),
    });
  }

  static async mobileGoogleAuth(req: Request, res: Response, next: NextFunction) {
    try {
      const body = req.validated?.body as MobileGoogleAuthInput;
      const query = req.validated?.query as MobileGoogleAuthQuery;

      const { token, user } = await AuthService.mobileGoogleAuth(body, query);

      res.status(200).json({
        status: HttpStatusText.SUCCESS,
        token,
        data: user,
      });
    } catch (err: any) {
      console.log(err.message);
      next(err);
    }
  }
}
