import jwt, { JwtPayload } from "jsonwebtoken";
import CustomError from "../types/customError";
import { HTTPStatusText } from "../types/HTTPStatusText";
import { AuthModel } from "../modules/auth/auth.model";
import { ErrorMessages } from "../types/errorsMessages";

export async function verifyToken(token?: string) {
  if (!token) throw new CustomError(ErrorMessages.INVALID_TOKEN, 401, HTTPStatusText.FAIL);

  if (!process.env.JWT_SECRET)
    throw new CustomError(ErrorMessages.AGORA_APP_ID_OR_CERTIFICATE_MISSING, 500, HTTPStatusText.ERROR);

  let decodedToken: JwtPayload;
  try {
    decodedToken = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
  } catch {
    throw new CustomError(ErrorMessages.INVALID_TOKEN, 401, HTTPStatusText.FAIL);
  }

  const user = await AuthModel.findUserById(decodedToken.id);
  if (!user) throw new CustomError(ErrorMessages.USER_NOT_FOUND, 401, HTTPStatusText.FAIL);
  if (user.deletedAt) throw new CustomError(ErrorMessages.USER_DELETED, 401, HTTPStatusText.FAIL);

  if (!decodedToken.iat) {
    throw new CustomError(ErrorMessages.INVALID_TOKEN_PAYLOAD, 401, HTTPStatusText.FAIL);
  }
  if (user.passwordChangedAt) {
    const isPasswordChanged = new Date(user.passwordChangedAt).getTime() / 1000 > decodedToken.iat;
    if (isPasswordChanged) throw new CustomError(ErrorMessages.PASSWORD_RECENTLY_CHANGED, 401, HTTPStatusText.FAIL);
  }

  return user;
}
