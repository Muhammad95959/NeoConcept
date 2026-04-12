CREATE UNIQUE INDEX users_email_unique_active ON "users" (email)
WHERE
  "deletedAt" IS NULL;

CREATE UNIQUE INDEX track_name_unique_active ON "tracks" (name)
WHERE
  "deletedAt" IS NULL;

