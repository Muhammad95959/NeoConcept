import fs from "fs/promises";
import { sendConfirmationEmail } from "../email.service";
import sendEmail from "../../../utils/sendEmail";

jest.mock("fs/promises");
jest.mock("../../utils/sendEmail");

describe("sendConfirmationEmail", () => {
  const mockRequest = {
    protocol: "https",
    get: jest.fn().mockReturnValue("example.com"),
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("reads confirmation template and replaces link", async () => {
    const template = "Click here: %%CONFIRMATION_LINK%%";
    (fs.readFile as jest.Mock).mockResolvedValue(template);
    (sendEmail as jest.Mock).mockResolvedValue(undefined);

    await sendConfirmationEmail("user@example.com", "token-abc", mockRequest);

    expect(fs.readFile).toHaveBeenCalledWith("public/emailConfirmationMessage.html", "utf-8");
    expect(sendEmail).toHaveBeenCalledWith(
      "user@example.com",
      "NeoConcept - Email Confirmation",
      "Click here: https://example.com/api/v1/auth/confirm-email/token-abc",
      true,
    );
  });

  it("handles multiple placeholder replacements", async () => {
    const template = "Confirm at: %%CONFIRMATION_LINK%% and also here: %%CONFIRMATION_LINK%%";
    (fs.readFile as jest.Mock).mockResolvedValue(template);
    (sendEmail as jest.Mock).mockResolvedValue(undefined);

    await sendConfirmationEmail("test@example.com", "token-xyz", mockRequest);

    expect(sendEmail).toHaveBeenCalledWith(
      "test@example.com",
      "NeoConcept - Email Confirmation",
      "Confirm at: https://example.com/api/v1/auth/confirm-email/token-xyz and also here: https://example.com/api/v1/auth/confirm-email/token-xyz",
      true,
    );
  });

  it("constructs protocol and host from request", async () => {
    const template = "Link: %%CONFIRMATION_LINK%%";
    (fs.readFile as jest.Mock).mockResolvedValue(template);
    (sendEmail as jest.Mock).mockResolvedValue(undefined);

    mockRequest.protocol = "http";
    mockRequest.get = jest.fn().mockReturnValue("localhost:3000");

    await sendConfirmationEmail("local@example.com", "token-local", mockRequest);

    expect(sendEmail).toHaveBeenCalledWith(
      "local@example.com",
      "NeoConcept - Email Confirmation",
      "Link: http://localhost:3000/api/v1/auth/confirm-email/token-local",
      true,
    );
  });

  it("sends email with html flag set to true", async () => {
    (fs.readFile as jest.Mock).mockResolvedValue("Content");
    (sendEmail as jest.Mock).mockResolvedValue(undefined);

    await sendConfirmationEmail("email@example.com", "token", mockRequest);

    const calls = (sendEmail as jest.Mock).mock.calls;
    expect(calls[0][3]).toBe(true); // html flag is true
  });

  it("propagates file read errors", async () => {
    const fileError = new Error("File not found");
    (fs.readFile as jest.Mock).mockRejectedValue(fileError);

    await expect(sendConfirmationEmail("user@example.com", "token", mockRequest)).rejects.toThrow("File not found");

    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("propagates email sending errors", async () => {
    (fs.readFile as jest.Mock).mockResolvedValue("Content with %%CONFIRMATION_LINK%%");
    const sendError = new Error("SMTP error");
    (sendEmail as jest.Mock).mockRejectedValue(sendError);

    await expect(sendConfirmationEmail("user@example.com", "token", mockRequest)).rejects.toThrow("SMTP error");
  });
});
