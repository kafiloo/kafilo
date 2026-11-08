export class RateLimitConfigurationError extends Error {
  constructor() {
    super("Upstash rate limiting is not configured.");
    this.name = "RateLimitConfigurationError";
  }
}

export type RateLimitResult = {
  allowed: boolean;
  retryAfter: number;
};

const localCounters = new Map<string, { count: number; resetAt: number }>();

function consumeLocalRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): RateLimitResult {
  const now = Date.now();
  const current = localCounters.get(key);
  const counter =
    current && current.resetAt > now
      ? current
      : { count: 0, resetAt: now + windowSeconds * 1000 };

  counter.count += 1;
  localCounters.set(key, counter);

  if (localCounters.size > 10_000) {
    for (const [storedKey, stored] of localCounters) {
      if (stored.resetAt <= now) localCounters.delete(storedKey);
    }
  }

  return {
    allowed: counter.count <= limit,
    retryAfter: Math.max(1, Math.ceil((counter.resetAt - now) / 1000)),
  };
}

function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

export function getRateLimitKey(
  request: Request,
  endpoint: string,
  identity?: string,
): string {
  const ip = getClientIp(request);
  return `kafipos:rate:${endpoint}:${ip}:${identity?.trim().toLowerCase() || "-"}`;
}

export async function consumeRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    console.warn("[rate-limit] Upstash belum dikonfigurasi; memakai fallback in-memory.");
    return consumeLocalRateLimit(key, limit, windowSeconds);
  }

  const response = await fetch(`${url.replace(/\/$/, "")}/pipeline`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify([
      ["INCR", key],
      ["EXPIRE", key, windowSeconds],
    ]),
  });

  if (!response.ok) {
    throw new Error(`upstash_rate_limit_failed_${response.status}`);
  }

  const results = (await response.json()) as Array<{ result?: number }>;
  const count = Number(results[0]?.result);
  if (!Number.isFinite(count)) {
    throw new Error("upstash_rate_limit_invalid_response");
  }

  return {
    allowed: count <= limit,
    retryAfter: windowSeconds,
  };
}

export async function enforceRateLimit(
  request: Request,
  endpoint: string,
  limit: number,
  windowSeconds: number,
  identity?: string,
): Promise<RateLimitResult | Response> {
  try {
    return await consumeRateLimit(
      getRateLimitKey(request, endpoint, identity),
      limit,
      windowSeconds,
    );
  } catch (error) {
    console.error("[rate-limit]", {
      event: "rate_limit_unavailable",
      endpoint,
      error: error instanceof Error ? error.name : "unknown",
    });
    return new Response(
      JSON.stringify({
        error: {
          code: "rate_limit_unavailable",
          message: "Rate limiting service tidak tersedia.",
        },
      }),
      {
        status: 503,
        headers: { "content-type": "application/json" },
      },
    );
  }
}

export function rateLimitResponse(retryAfter: number): Response {
  return new Response(
    JSON.stringify({
      error: {
        code: "rate_limited",
        message: "Terlalu banyak permintaan.",
        retry_after: retryAfter,
      },
    }),
    {
      status: 429,
      headers: {
        "content-type": "application/json",
        "Retry-After": String(retryAfter),
      },
    },
  );
}
