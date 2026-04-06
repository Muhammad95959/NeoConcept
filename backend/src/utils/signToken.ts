import jwt from "jsonwebtoken";
import { StringValue } from "ms";
import { ErrorMessages } from "../types/errorsMessages";

export default function signToken(id: string) {
  if (!process.env.JWT_SECRET) throw new Error(ErrorMessages.AGORA_APP_ID_OR_CERTIFICATE_MISSING);
  const expiresIn = (process.env.JWT_EXPIRES_IN as StringValue) || "1d";
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn });
}
