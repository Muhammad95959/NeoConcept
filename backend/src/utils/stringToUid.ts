import crypto from "crypto";

export function stringToUid(str: string): number {
  const hash = crypto.createHash("sha256").update(str).digest("hex");

  const num = parseInt(hash.substring(0, 8), 16);

  return (num % 10000) + 1;
}
