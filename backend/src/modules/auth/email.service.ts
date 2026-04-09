import fs from "fs/promises";
import sendEmail from "../../utils/sendEmail";


export async function sendConfirmationEmail(
  email: string,
  confirmEmailToken: string,
  req: any
) {
  const rawMessage = await fs.readFile(
    "public/emailConfirmationMessage.html",
    "utf-8"
  );

  const confirmationLink = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/auth/confirm-email/${confirmEmailToken}`;

  const message = rawMessage.replaceAll(
    "%%CONFIRMATION_LINK%%",
    confirmationLink
  );

  await sendEmail(
    email,
    "NeoConcept - Email Confirmation",
    message,
    true
  );
}