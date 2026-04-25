import jwt from "jsonwebtoken";
import { StringValue } from "ms";
import { ErrorMessages } from "../types/errorsMessages";

interface TokenData {
  id: string;
  username?: string;
}

export default function signToken(data: string | TokenData) {
  if (!process.env.JWT_SECRET) throw new Error(ErrorMessages.AGORA_APP_ID_OR_CERTIFICATE_MISSING);
  const expiresIn = (process.env.JWT_EXPIRES_IN as StringValue) || "1d";
  const payload = typeof data === "string" ? { id: data } : { id: data.id, username: data.username };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
}
