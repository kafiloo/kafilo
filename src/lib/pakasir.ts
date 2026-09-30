// =============================================================
// lib/pakasir.ts — Pakasir API v2 client (SERVER ONLY)
// Jangan import dari Client Component. Header `X-Api-Key`.
// API key tidak pernah ditulis ke log.
// =============================================================

if (typeof window !== "undefined") {
  throw new Error("[pakasir] lib/pakasir.ts hanya boleh dipakai di server.");
}

import { getPakasirEnv } from "@/lib/env";

export const PAKASIR_METHODS = [
  "payment_link",
  "qris",
  "bri_va",
  "bni_va",
  "cimb_niaga_va",
  "permata_va",
  "maybank_va",
  "bnc_va",
  "artha_graha_va",
  "atm_bersama_va",
  "sampoerna_va",
] as const;

export type PakasirMethod = (typeof PAKASIR_METHODS)[number];
export type PakasirTxnStatus = "pending" | "completed" | "canceled";

export const PAKASIR_METHOD_LIMITS: Record<
  PakasirMethod,
  { min: number; max: number }
> = {
  payment_link: { min: 500, max: 50_000_000 },
  qris: { min: 500, max: 10_000_000 },
  bri_va: { min: 10_000, max: 50_000_000 },
  bni_va: { min: 10_000, max: 50_000_000 },
  cimb_niaga_va: { min: 10_000, max: 50_000_000 },
  permata_va: { min: 10_000, max: 50_000_000 },
  maybank_va: { min: 10_000, max: 50_000_000 },
  bnc_va: { min: 10_000, max: 50_000_000 },
  artha_graha_va: { min: 10_000, max: 50_000_000 },
  atm_bersama_va: { min: 10_000, max: 50_000_000 },
  sampoerna_va: { min: 10_000, max: 50_000_000 },
};

export class PakasirError extends Error {
  readonly status?: number;
  readonly code: string;
  constructor(message: string, opts?: { status?: number; code?: string }) {
    super(message);
    this.name = "PakasirError";
    this.status = opts?.status;
    this.code = opts?.code ?? "PAKASIR_ERROR";
  }
}

export class PakasirValidationError extends PakasirError {
  constructor(message: string) {
    super(message, { code: "PAKASIR_VALIDATION" });
    this.name = "PakasirValidationError";
  }
}

export class PakasirNetworkError extends PakasirError {
  constructor(message: string) {
    super(message, { code: "PAKASIR_NETWORK" });
    this.name = "PakasirNetworkError";
  }
}

export function assertPakasirAmount(method: PakasirMethod, amount: number): void {
  const limits = PAKASIR_METHOD_LIMITS[method];
  if (!limits) throw new PakasirValidationError(`Metode tidak dikenal: ${method}`);
  if (!Number.isInteger(amount))
    throw new PakasirValidationError("amount harus integer (rupiah).");
  if (amount < limits.min || amount > limits.max)
    throw new PakasirValidationError(
      `Nominal Rp ${amount.toLocaleString("id-ID")} di luar batas ${method} ` +
        `(min Rp ${limits.min.toLocaleString("id-ID")}, maks Rp ${limits.max.toLocaleString("id-ID")}).`
    );
}

export function isMethodAllowed(method: PakasirMethod, amount: number): boolean {
  const limits = PAKASIR_METHOD_LIMITS[method];
  if (!limits) return false;
  return Number.isInteger(amount) && amount >= limits.min && amount <= limits.max;
}

export interface CreateTransactionInput {
  method: PakasirMethod;
  amount: number;
}

export interface PaymentLinkTransaction {
  kind: "payment_link";
  txn_id: string;
  payment_link: string;
}

export interface DirectTransaction {
  kind: Exclude<PakasirMethod, "payment_link">;
  txn_id: string;
  project: string;
  order_id: string;
  amount: number;
  fee: number;
  total_payment: number;
  payment_method: string;
  qr_string: string | null;
  va_number: string | null;
  expired_at: string;
  is_sandbox: boolean;
}

/** Discriminated union payment_link vs direct (QRIS/VA). */
export type CreateTransactionResult = PaymentLinkTransaction | DirectTransaction;

export interface TransactionStatusResponse {
  txn_id: string;
  order_id: string;
  amount: number;
  is_sandbox: boolean;
  status: PakasirTxnStatus;
  completed_at: string | null;
}

export interface CancelTransactionResponse {
  message: string;
}

export type PaymentFeeMap = Partial<Record<PakasirMethod, number>>;

export interface PakasirWebhookPayload {
  txn_id: string;
  order_id: string;
  amount: number;
  is_sandbox: boolean;
  status: "completed";
  completed_at: string | null;
}

export function buildPaymentLink(
  baseLink: string,
  opts?: { qrisOnly?: boolean; redirectUrl?: string }
): string {
  if (!opts || (!opts.qrisOnly && !opts.redirectUrl)) return baseLink;
  const sep = baseLink.includes("?") ? "&" : "?";
  const params = new URLSearchParams();
  if (opts.qrisOnly) params.set("qris_only", "1");
  if (opts.redirectUrl) params.set("redirect", opts.redirectUrl);
  return `${baseLink}${sep}${params.toString()}`;
}

const FETCH_TIMEOUT_MS = 15_000;

async function pakasirFetch<T>(
  url: string,
  init: RequestInit & { withApiKey: boolean }
): Promise<T> {
  const { withApiKey, ...rest } = init;
  const env = getPakasirEnv();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      ...rest,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(withApiKey ? { "X-Api-Key": env.apiKey } : {}),
        ...(rest.headers ?? {}),
      },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new PakasirError(
        `Pakasir API error ${res.status}: ${text.slice(0, 300) || res.statusText}`,
        { status: res.status }
      );
    }
    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof PakasirError) throw err;
    if (err instanceof DOMException && err.name === "AbortError")
      throw new PakasirNetworkError(`Pakasir API timeout setelah ${FETCH_TIMEOUT_MS}ms`);
    throw new PakasirNetworkError(
      `Pakasir API network error: ${(err as Error)?.message ?? String(err)}`
    );
  } finally {
    clearTimeout(timer);
  }
}

/** POST /api/v2/create-transaction/{slug}/{order_id} (idempoten). */
export async function createTransaction(
  orderId: string,
  input: CreateTransactionInput
): Promise<CreateTransactionResult> {
  if (!orderId || typeof orderId !== "string")
    throw new PakasirValidationError("order_id wajib string tidak kosong.");
  if (!(PAKASIR_METHODS as readonly string[]).includes(input.method))
    throw new PakasirValidationError(
      `method tidak valid: ${String(input.method)}. Pilih: ${PAKASIR_METHODS.join(", ")}.`
    );
  assertPakasirAmount(input.method, input.amount);
  const env = getPakasirEnv();
  const url =
    `${env.baseUrl}/api/v2/create-transaction/` +
    `${encodeURIComponent(env.slug)}/${encodeURIComponent(orderId)}`;
  const raw = await pakasirFetch<Record<string, unknown>>(url, {
    method: "POST",
    withApiKey: true,
    body: JSON.stringify({ method: input.method, amount: input.amount }),
  });
  if (input.method === "payment_link") {
    if (typeof raw.txn_id !== "string" || typeof raw.payment_link !== "string")
      throw new PakasirError("Respons payment_link Pakasir tidak valid.");
    return { kind: "payment_link", txn_id: raw.txn_id, payment_link: raw.payment_link };
  }
  if (typeof raw.txn_id !== "string")
    throw new PakasirError("Respons transaksi Pakasir tidak valid (txn_id hilang).");
  return {
    kind: input.method,
    txn_id: raw.txn_id as string,
    project: (raw.project as string) ?? "",
    order_id: (raw.order_id as string) ?? orderId,
    amount: Number(raw.amount ?? input.amount),
    fee: Number(raw.fee ?? 0),
    total_payment: Number(raw.total_payment ?? input.amount),
    payment_method: (raw.payment_method as string) ?? input.method,
    qr_string: (raw.qr_string as string | null) ?? null,
    va_number: (raw.va_number as string | null) ?? null,
    expired_at: (raw.expired_at as string) ?? "",
    is_sandbox: Boolean(raw.is_sandbox ?? false),
  };
}

/** GET /api/v2/transaction-status/{slug}/{txn_id} (1 req / 4 dtk). */
export async function getTransactionStatus(txnId: string): Promise<TransactionStatusResponse> {
  if (!txnId) throw new PakasirValidationError("txn_id wajib diisi.");
  const env = getPakasirEnv();
  const url =
    `${env.baseUrl}/api/v2/transaction-status/` +
    `${encodeURIComponent(env.slug)}/${encodeURIComponent(txnId)}`;
  return pakasirFetch<TransactionStatusResponse>(url, { method: "GET", withApiKey: true });
}

/** POST /api/v2/cancel-transaction/{slug}/{txn_id} */
export async function cancelTransaction(txnId: string): Promise<CancelTransactionResponse> {
  if (!txnId) throw new PakasirValidationError("txn_id wajib diisi.");
  const env = getPakasirEnv();
  const url =
    `${env.baseUrl}/api/v2/cancel-transaction/` +
    `${encodeURIComponent(env.slug)}/${encodeURIComponent(txnId)}`;
  return pakasirFetch<CancelTransactionResponse>(url, { method: "POST", withApiKey: true });
}

/** GET /api/v2/payment-fee/{amount} (publik, tanpa API key). */
export async function getPaymentFees(amount: number): Promise<PaymentFeeMap> {
  if (!Number.isInteger(amount) || amount <= 0)
    throw new PakasirValidationError("amount harus integer positif (rupiah).");
  const env = getPakasirEnv();
  const url = `${env.baseUrl}/api/v2/payment-fee/${amount}`;
  return pakasirFetch<PaymentFeeMap>(url, { method: "GET", withApiKey: false });
}

