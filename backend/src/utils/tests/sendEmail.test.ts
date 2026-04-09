import nodemailer from "nodemailer";
import sendEmail from "../sendEmail";

jest.mock("nodemailer", () => ({
  __esModule: true,
  default: {
    createTransport: jest.fn(),
  },
}));

describe("sendEmail", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      GMAIL: "sender@example.com",
      GMAIL_APP_PASSWORD: "app-password",
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("sends plain text emails", () => {
    const sendMailMock = jest.fn();
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: sendMailMock,
    });

    sendEmail("to@example.com", "Hello", "Plain message");

    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      service: "gmail",
      auth: {
        user: "sender@example.com",
        pass: "app-password",
      },
    });
    expect(sendMailMock).toHaveBeenCalledWith(
      {
        from: "sender@example.com",
        to: "to@example.com",
        subject: "Hello",
        text: "Plain message",
        html: undefined,
      },
      expect.any(Function),
    );
  });

  it("sends html emails and logs success callback", () => {
    const sendMailMock = jest.fn();
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => undefined);

    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: sendMailMock,
    });

    sendEmail("to@example.com", "HTML", "<p>Hello</p>", true);

    const callback = sendMailMock.mock.calls[0][1] as (error: unknown, info: { response: string }) => void;
    callback(null, { response: "250 OK" });

    expect(sendMailMock).toHaveBeenCalledWith(
      {
        from: "sender@example.com",
        to: "to@example.com",
        subject: "HTML",
        text: undefined,
        html: "<p>Hello</p>",
      },
      expect.any(Function),
    );
    expect(logSpy).toHaveBeenCalledWith("Email sent successfully:", "250 OK");

    logSpy.mockRestore();
  });

  it("logs error when sending fails", () => {
    const sendMailMock = jest.fn();
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => undefined);

    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: sendMailMock,
    });

    sendEmail("to@example.com", "Error case", "body");

    const callback = sendMailMock.mock.calls[0][1] as (error: Error, info?: { response: string }) => void;
    callback(new Error("send failed"));

    expect(logSpy).toHaveBeenCalledWith("Error sending email:", expect.any(Error));

    logSpy.mockRestore();
  });
});
