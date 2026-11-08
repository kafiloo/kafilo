import { hashVerificationToken } from "./verification-token";

export type VerificationFailure = "token_invalid" | "token_expired" | "token_used";

export function getVerificationFailure(
  token: {
    usedAt: Date | null;
    revokedAt: Date | null;
    expiresAt: Date;
  } | null,
  now = new Date(),
): VerificationFailure | null {
  if (!token || token.revokedAt) return "token_invalid";
  if (token.usedAt) return "token_used";
  if (token.expiresAt <= now) return "token_expired";
  return null;
}

export function getTokenHash(rawToken: string): string {
  return hashVerificationToken(rawToken.trim());
}
