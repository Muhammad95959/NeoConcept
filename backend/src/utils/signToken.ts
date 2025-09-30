import jwt from "jsonwebtoken";

export default function signToken(id: number) {
  const expiresIn = "30d";
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not defined");
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn });
}

