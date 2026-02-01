import jwt from "jsonwebtoken";
import { StringValue } from "ms";

export default function signToken(id: string) {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not defined");
  const expiresIn = process.env.JWT_EXPIRES_IN as StringValue || "1d";
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn });
}
