import { NextFunction, Request, Response } from "express";
import safeUserData from "../../utils/safeUserData";
import { sendConfirmationEmail } from "./email.service";
import { AuthService } from "./auth.service";
import { HTTPStatusText } from "../../types/HTTPStatusText";
import {
  ConfirmEmailParams,
  ForgotPasswordBody,
  LoginBody,
  MobileGoogleAuthBody,
  MobileGoogleAuthQuery,
  ResendConfirmationEmailBody,
  ResetPasswordBody,
  VerifyOTPBody,
} from "./auth.validation";
import { SuccessMessages } from "../../types/successMessages";
import { Constants } from "../../types/constants";

export class AuthController {
  static async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const { confirmEmailToken, isDev } = await AuthService.signup(req.body);

      if (!isDev) {
        await sendConfirmationEmail(req.body.email, confirmEmailToken, req);
      }

      res.status(201).json({
        status: HTTPStatusText.SUCCESS,
        message: isDev ? SuccessMessages.DEV_SIGNUP : SuccessMessages.CONFIRM_EMAIL,
      });
    } catch (err: any) {
      next(err);
    }
  }

  static async confirmEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = res.locals.params as ConfirmEmailParams;
      const html = await AuthService.confirmEmail({ token });

      res.status(200).send(html);
    } catch (err: any) {
      if (err.html) return res.status(err.status || 400).send(err.html);
      next(err);
    }
  }

  static async resendConfirmationEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = res.locals.body as ResendConfirmationEmailBody;

      await AuthService.resendConfirmationEmail({ email });

      res.status(201).json({
        status: HTTPStatusText.SUCCESS,
        message: SuccessMessages.NEW_CONFIRMATION,
      });
    } catch (err) {
      next(err);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data = res.locals.body as LoginBody;
      const { token, user } = await AuthService.login(data);

      res.cookie("jwt", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === Constants.PRODUCTION,
        sameSite: process.env.NODE_ENV === Constants.PRODUCTION ? "none" : "lax",
      });

      res.status(200).json({
        status: HTTPStatusText.SUCCESS,
        token,
        data: user,
      });
    } catch (err) {
      next(err);
    }
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body as ForgotPasswordBody;

      const result = await AuthService.forgotPassword({ email });

      res.status(201).json({
        status: HTTPStatusText.SUCCESS,
        ...result,
      });
    } catch (err: any) {
      next(err);
    }
  }

  static async verifyOTP(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otp } = res.locals.body as VerifyOTPBody;

      const result = await AuthService.verifyOTP({ email, otp });

      res.status(200).json({
        status: HTTPStatusText.SUCCESS,
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otp, newPassword } = res.locals.body as ResetPasswordBody;

      const result = await AuthService.resetPassword({ email, otp, newPassword });

      res.status(200).json({
        status: HTTPStatusText.SUCCESS,
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  }

  static logout(_req: Request, res: Response) {
    res.clearCookie("jwt");
    res.status(200).json({
      status: HTTPStatusText.SUCCESS,
      message: SuccessMessages.LOGGED_OUT,
    });
  }

  static authorize(_req: Request, res: Response) {
    res.status(200).json({
      status: HTTPStatusText.SUCCESS,
      data: safeUserData(res.locals.user),
    });
  }

  static async mobileGoogleAuth(req: Request, res: Response, next: NextFunction) {
    try {
      const body = res.locals.body as MobileGoogleAuthBody;
      const query = res.locals.query as MobileGoogleAuthQuery;

      const { token, user } = await AuthService.mobileGoogleAuth(body, query);

      res.status(200).json({
        status: HTTPStatusText.SUCCESS,
        token,
        data: user,
      });
    } catch (err: any) {
      next(err);
    }
  }
}
