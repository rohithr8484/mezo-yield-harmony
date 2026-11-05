import { describe, expect, it } from "vitest";
import { getVeMezoLockDuration, VEMEZO_LOCK_AMOUNT, VEMEZO_LOCK_WEEKS } from "./veMezoLock";

describe("veMEZO two-week lock", () => {
  it("locks exactly 2 MEZO", () => {
    expect(VEMEZO_LOCK_AMOUNT).toBe("2");
  });
  it("adds two weeks after the existing options and requests 1,209,600 seconds", () => {
    expect(VEMEZO_LOCK_WEEKS).toEqual([52, 1, 2]);
    expect(getVeMezoLockDuration(2)).toBe(1_209_600);
    expect(getVeMezoLockDuration(1)).toBe(604_800);
    expect(getVeMezoLockDuration(52)).toBe(31_449_600);
  });
});