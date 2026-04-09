import { stringToUid } from "../stringToUid";

describe("stringToUid", () => {
  it("returns deterministic uid for same input", () => {
    const uid1 = stringToUid("neo-user");
    const uid2 = stringToUid("neo-user");

    expect(uid1).toBe(uid2);
  });

  it("keeps uid inside expected range", () => {
    const uid = stringToUid("another-user");

    expect(uid).toBeGreaterThanOrEqual(1);
    expect(uid).toBeLessThanOrEqual(10000);
  });
});
