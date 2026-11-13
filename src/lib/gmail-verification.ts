import { importPKCS8, SignJWT } from "jose";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send";

export class GmailConfigurationError extends Error {
  constructor() {
    super("Gmail verification delivery is not configured.");
    this.name = "GmailConfigurationError";
  }
}

export function buildVerificationEmail(
  to: string,
  verificationUrl: string,
): string {
  const from = process.env.GMAIL_FROM_EMAIL;
  if (!from) {
    throw new GmailConfigurationError();
  }

  const body = [
    `From: ${from}`,
    `To: ${to}`,
    "Subject: Verifikasi email Kafipos",
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "",
    `Verifikasi email kamu melalui tautan berikut: ${verificationUrl}`,
  ].join("\r\n");

  return Buffer.from(body, "utf8").toString("base64url");
}

async function getAccessToken(): Promise<string> {
  const serviceAccountEmail = process.env.GMAIL_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GMAIL_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const delegatedUser = process.env.GMAIL_DELEGATED_USER;

  if (!serviceAccountEmail || !privateKey || !delegatedUser) {
    throw new GmailConfigurationError();
  }

  const now = Math.floor(Date.now() / 1000);
  const key = await importPKCS8(privateKey, "RS256");
  const assertion = await new SignJWT({
    iss: serviceAccountEmail,
    scope: GMAIL_SEND_SCOPE,
    aud: GOOGLE_TOKEN_URL,
    sub: delegatedUser,
  })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!response.ok) {
    throw new Error(`gmail_token_request_failed_${response.status}`);
  }

  const payload = (await response.json()) as { access_token?: string };
  if (!payload.access_token) {
    throw new Error("gmail_token_missing");
  }

  return payload.access_token;
}

export async function sendVerificationEmail(
  to: string,
  rawToken: string,
): Promise<void> {
  const appUrl = process.env.APP_URL;
  const delegatedUser = process.env.GMAIL_DELEGATED_USER;
  if (!appUrl || !delegatedUser) {
    throw new GmailConfigurationError();
  }

  const accessToken = await getAccessToken();
  const verificationUrl = `${appUrl.replace(/\/$/, "")}/cek-email?token=${encodeURIComponent(rawToken)}`;
  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/${encodeURIComponent(delegatedUser)}/messages/send`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ raw: buildVerificationEmail(to, verificationUrl) }),
    },
  );

  if (!response.ok) {
    throw new Error(`gmail_send_failed_${response.status}`);
  }
}
