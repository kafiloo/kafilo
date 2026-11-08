import { afterEach, describe, expect, it, vi } from "vitest";
import { consumeRateLimit, getRateLimitKey } from "../src/lib/rate-limit";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("rate limit keys", () => {
  it("combines endpoint, client IP, and identity", () => {
    const request = new Request("https://app.example.com/api/auth/login", {
      headers: { "x-forwarded-for": "203.0.113.10, 10.0.0.1" },
    });
    expect(getRateLimitKey(request, "login", "Owner@Example.com")).toBe(
      "kafipos:rate:login:203.0.113.10:owner@example.com",
    );
  });

  it("allows local requests when Upstash is not configured", async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");

    await expect(consumeRateLimit("test-key", 5, 60)).resolves.toEqual({
      allowed: true,
      retryAfter: 0,
    });
  });
});
