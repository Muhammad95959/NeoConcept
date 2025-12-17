CREATE UNIQUE INDEX users_email_unique_active ON "users" (email)
WHERE
  "deletedAt" IS NULL;

