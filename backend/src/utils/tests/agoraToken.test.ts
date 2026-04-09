import { ErrorMessages } from "../../types/errorsMessages";

jest.mock("../agora/rtcTokenBuilder2", () => ({
  Role: {
    PUBLISHER: 1,
  },
  RtcTokenBuilder: {
    buildTokenWithUserAccount: jest.fn(),
  },
}));

describe("generateAgoraToken", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("throws when APP_ID or APP_CERTIFICATE is missing", () => {
    delete process.env.AGORA_APP_ID;
    delete process.env.AGORA_APP_CERT;

    const { generateAgoraToken } = require("../agoraToken") as typeof import("../agoraToken");

    expect(() => generateAgoraToken("room-1", "user-1")).toThrow(
      ErrorMessages.AGORA_APP_ID_OR_CERTIFICATE_MISSING,
    );
  });

  it("builds Agora token with expected payload", () => {
    process.env.AGORA_APP_ID = "app-id";
    process.env.AGORA_APP_CERT = "app-cert";
    const nowSpy = jest.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);

    const { RtcTokenBuilder, Role } = require("../agora/rtcTokenBuilder2") as typeof import("../agora/rtcTokenBuilder2");
    (RtcTokenBuilder.buildTokenWithUserAccount as jest.Mock).mockReturnValue("agora-token");

    const { generateAgoraToken } = require("../agoraToken") as typeof import("../agoraToken");

    const token = generateAgoraToken("room-2", "user-2");

    expect(token).toBe("agora-token");
    expect(RtcTokenBuilder.buildTokenWithUserAccount).toHaveBeenCalledWith(
      "app-id",
      "app-cert",
      "room-2",
      "user-2",
      Role.PUBLISHER,
      1_700_000_000 + 3600,
    );

    nowSpy.mockRestore();
  });
});
