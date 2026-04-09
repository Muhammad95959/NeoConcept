import jwt from "jsonwebtoken";
import { ErrorMessages } from "../../types/errorsMessages";
import signToken from "../signToken";

jest.mock("jsonwebtoken", () => ({
  __esModule: true,
  default: {
    sign: jest.fn(),
  },
}));

describe("signToken", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("throws when JWT_SECRET is missing", () => {
    delete process.env.JWT_SECRET;

    expect(() => signToken("u-1")).toThrow(ErrorMessages.AGORA_APP_ID_OR_CERTIFICATE_MISSING);
  });

  it("signs token with default expiry", () => {
    process.env.JWT_SECRET = "secret";
    delete process.env.JWT_EXPIRES_IN;
    (jwt.sign as jest.Mock).mockReturnValue("signed-token");

    const token = signToken("u-2");

    expect(token).toBe("signed-token");
    expect(jwt.sign).toHaveBeenCalledWith({ id: "u-2" }, "secret", { expiresIn: "1d" });
  });

  it("signs token with configured expiry", () => {
    process.env.JWT_SECRET = "secret";
    process.env.JWT_EXPIRES_IN = "7d";
    (jwt.sign as jest.Mock).mockReturnValue("signed-token-2");

    const token = signToken("u-3");

    expect(token).toBe("signed-token-2");
    expect(jwt.sign).toHaveBeenCalledWith({ id: "u-3" }, "secret", { expiresIn: "7d" });
  });
});
