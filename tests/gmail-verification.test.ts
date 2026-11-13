import { describe, expect, it } from "vitest";
import { buildVerificationEmail } from "../src/lib/gmail-verification";

describe("Gmail verification email", () => {
  it("encodes a message with the verification link", () => {
    process.env.GMAIL_FROM_EMAIL = "noreply@example.com";
    const encoded = buildVerificationEmail(
      "owner@example.com",
      "https://app.example.com/verify-email?token=abc",
    );
    const decoded = Buffer.from(encoded, "base64url").toString("utf8");
    expect(decoded).toContain("To: owner@example.com");
    expect(decoded).toContain("https://app.example.com/verify-email?token=abc");
  });
});
