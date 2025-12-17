import { User } from "../generated/prisma/client";

export default function safeUserData(user: User) {
  const { id, email, username, role, googleId, emailConfirmed, currentTrackId, deletedAt } = user;
  return { id, email, username, role, googleId, emailConfirmed, currentTrackId, deletedAt  };
}

