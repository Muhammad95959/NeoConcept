import safeUserData from "../safeUserData";

describe("safeUserData", () => {
  it("removes sensitive user fields", () => {
    const user = {
      id: "u-1",
      email: "user@example.com",
      username: "neo",
      role: "STUDENT",
      password: "hashed",
      resetPasswordExpires: new Date(),
      resetPasswordOTP: "otp",
      passwordChangedAt: new Date(),
      confirmEmailToken: "token",
      confirmEmailExpires: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      googleId: null,
      emailConfirmed: true,
      currentTrackId: null,
      otpAttempts: 0,
    } as any;

    const safeUser = safeUserData(user);

    expect(safeUser).toMatchObject({
      id: "u-1",
      email: "user@example.com",
      username: "neo",
      role: "STUDENT",
    });
    expect(safeUser).not.toHaveProperty("password");
    expect(safeUser).not.toHaveProperty("resetPasswordOTP");
    expect(safeUser).not.toHaveProperty("confirmEmailToken");
  });
});
