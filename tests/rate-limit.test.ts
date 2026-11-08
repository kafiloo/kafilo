import { describe, expect, it } from "vitest";
import { getRateLimitKey } from "../src/lib/rate-limit";

describe("rate limit keys", () => {
  it("combines endpoint, client IP, and identity", () => {
    const request = new Request("https://app.example.com/api/auth/login", {
      headers: { "x-forwarded-for": "203.0.113.10, 10.0.0.1" },
    });
    expect(getRateLimitKey(request, "login", "Owner@Example.com")).toBe(
      "kafipos:rate:login:203.0.113.10:owner@example.com",
    );
  });
});
