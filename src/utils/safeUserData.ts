import { User } from "@prisma/client";

export default function safeUserData(user: User) {
  const { id, email, username, role, googleId, emailConfirmed } = user;
  return { id, email, username, role, googleId, emailConfirmed };
}

