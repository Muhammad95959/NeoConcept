-- Delete users created today (April 25, 2026)
-- This script removes all users where the creation date is today's date

DELETE FROM "users"
WHERE DATE("createdAt") = CURRENT_DATE;
