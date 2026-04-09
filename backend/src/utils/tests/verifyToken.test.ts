import jwt from "jsonwebtoken";
import { AuthModel } from "../../modules/auth/auth.model";
import { ErrorMessages } from "../../types/errorsMessages";
import { verifyToken } from "../verifyToken";

jest.mock("jsonwebtoken", () => ({
  __esModule: true,
  default: {
    verify: jest.fn(),
  },
}));

jest.mock("../../modules/auth/auth.model", () => ({
  AuthModel: {
    findUserById: jest.fn(),
  },
}));

describe("verifyToken", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, JWT_SECRET: "secret" };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("throws when token is missing", async () => {
    await expect(verifyToken()).rejects.toMatchObject({
      message: ErrorMessages.INVALID_TOKEN,
      statusCode: 401,
    });
  });

  it("throws when JWT secret is missing", async () => {
    delete process.env.JWT_SECRET;

    await expect(verifyToken("token")).rejects.toMatchObject({
      message: ErrorMessages.AGORA_APP_ID_OR_CERTIFICATE_MISSING,
      statusCode: 500,
    });
  });

  it("throws when jwt verify fails", async () => {
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error("invalid");
    });

    await expect(verifyToken("bad-token")).rejects.toMatchObject({
      message: ErrorMessages.INVALID_TOKEN,
      statusCode: 401,
    });
  });

  it("throws when user is not found", async () => {
    (jwt.verify as jest.Mock).mockReturnValue({ id: "u-1", iat: 1000 });
    (AuthModel.findUserById as jest.Mock).mockResolvedValue(null);

    await expect(verifyToken("token")).rejects.toMatchObject({
      message: ErrorMessages.USER_NOT_FOUND,
      statusCode: 401,
    });
  });

  it("throws when user is deleted", async () => {
    (jwt.verify as jest.Mock).mockReturnValue({ id: "u-2", iat: 1000 });
    (AuthModel.findUserById as jest.Mock).mockResolvedValue({ deletedAt: new Date() });

    await expect(verifyToken("token")).rejects.toMatchObject({
      message: ErrorMessages.USER_DELETED,
      statusCode: 401,
    });
  });

  it("throws when token payload misses iat", async () => {
    (jwt.verify as jest.Mock).mockReturnValue({ id: "u-3" });
    (AuthModel.findUserById as jest.Mock).mockResolvedValue({ deletedAt: null, passwordChangedAt: null });

    await expect(verifyToken("token")).rejects.toMatchObject({
      message: ErrorMessages.INVALID_TOKEN_PAYLOAD,
      statusCode: 401,
    });
  });

  it("throws when password was changed after token issuance", async () => {
    (jwt.verify as jest.Mock).mockReturnValue({ id: "u-4", iat: 1000 });
    (AuthModel.findUserById as jest.Mock).mockResolvedValue({
      deletedAt: null,
      passwordChangedAt: new Date((1000 + 10) * 1000),
    });

    await expect(verifyToken("token")).rejects.toMatchObject({
      message: ErrorMessages.PASSWORD_RECENTLY_CHANGED,
      statusCode: 401,
    });
  });

  it("returns user when token is valid", async () => {
    const user = {
      id: "u-5",
      deletedAt: null,
      passwordChangedAt: new Date((1000 - 10) * 1000),
    };

    (jwt.verify as jest.Mock).mockReturnValue({ id: "u-5", iat: 1000 });
    (AuthModel.findUserById as jest.Mock).mockResolvedValue(user);

    await expect(verifyToken("token")).resolves.toEqual(user);
  });
});
