import nodemailer from "nodemailer";
import { Address } from "nodemailer/lib/mailer";

export default function sendEmail(
  userEmail: string | Address | (string | Address)[] | undefined,
  subject: string,
  message: string,
  html?: boolean
) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.GMAIL,
    to: userEmail,
    subject,
    text: html ? undefined : message,
    html: html ? message : undefined
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) return console.log("Error sending email:", error);
    console.log("Email sent successfully:", info.response);
  });
}
