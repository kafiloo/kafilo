import { describe, expect, it } from "vitest";
import { getVerificationFailure } from "../src/lib/email-verification";

describe("email verification state", () => {
  const now = new Date("2026-11-09T00:00:00.000Z");

  it("distinguishes invalid, expired, and used tokens", () => {
    expect(getVerificationFailure(null, now)).toBe("token_invalid");
    expect(
      getVerificationFailure(
        { usedAt: null, revokedAt: null, expiresAt: new Date("2026-11-08T23:59:59Z") },
        now,
      ),
    ).toBe("token_expired");
    expect(
      getVerificationFailure(
        { usedAt: now, revokedAt: null, expiresAt: new Date("2026-11-10T00:00:00Z") },
        now,
      ),
    ).toBe("token_used");
  });
});
