import { console } from "node:inspector";
import nodemailer from "nodemailer";
import { Address } from "nodemailer/lib/mailer";

export default function sendEmail(userEmail: string | Address | (string | Address)[] | undefined) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL,
    to: userEmail,
    subject: "Test Email from Node.js",
    text: "Hello, this is a test email sent from Node.js using nodemailer",
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) return console.log("Error sending email:", error);
    console.log("Email sent successfully:", info.response);
  });
}
