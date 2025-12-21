import { User } from "../generated/prisma/client";

export default function safeUserData(user: User) {
  const {
    password,
    resetPasswordExpires,
    resetPasswordOTP,
    passwordChangedAt,
    confirmEmailToken,
    confirmEmailExpires,
    ...rest
  } = user;
  return rest;
}
