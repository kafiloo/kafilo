import { describe, expect, it } from "vitest";
import {
  createVerificationToken,
  hashVerificationToken,
  VERIFICATION_TOKEN_TTL_MS,
} from "../src/lib/verification-token";

describe("email verification tokens", () => {
  it("creates a random hashable token with a 24-hour expiry", () => {
    const now = new Date("2026-11-09T00:00:00.000Z");
    const token = createVerificationToken(now);

    expect(token.rawToken).toHaveLength(43);
    expect(token.tokenHash).toBe(hashVerificationToken(token.rawToken));
    expect(token.expiresAt.getTime()).toBe(now.getTime() + VERIFICATION_TOKEN_TTL_MS);
  });

  it("does not store the raw token in the hash", () => {
    const token = createVerificationToken();
    expect(token.tokenHash).not.toContain(token.rawToken);
  });
});
