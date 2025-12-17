CREATE UNIQUE INDEX track_name_unique_active ON "tracks" (name)
WHERE
  "deletedAt" IS NULL;

