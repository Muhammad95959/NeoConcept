import createRandomOTP from "../createRandomOTP";

describe("createRandomOTP", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns empty string when length is 0", () => {
    expect(createRandomOTP(0)).toBe("");
  });

  it("ensures first digit is not zero", () => {
    const randomSpy = jest
      .spyOn(Math, "random")
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.9)
      .mockReturnValueOnce(0.2)
      .mockReturnValueOnce(0.4);

    const otp = createRandomOTP(3);

    expect(otp).toBe("924");
    expect(randomSpy).toHaveBeenCalled();
  });
});
