// =============================================================
// QRISLY API Client
// Docs: https://api.collaborator.komerce.id/user
// Auth: header `X-API-Key: YOUR_API_KEY`
// =============================================================

const QRISLY_BASE_URL =
  process.env.QRISLY_BASE_URL ||
  "https://api-sandbox.collaborator.komerce.id/user";
const QRISLY_API_KEY = process.env.QRISLY_API_KEY;

if (!QRISLY_API_KEY) {
  console.warn("[qrisly] QRISLY_API_KEY belum di-set di .env");
}

// -------------------------------------------------------------
// Types
// -------------------------------------------------------------

export interface QrisUploadResponse {
  success: boolean;
  message: string;
  data: {
    qris_id: number;
    provider: string;
    name: string;
    merchant_name: string;
    created_at: string;
  };
}

export interface GenerateQrisRequest {
  qris_id: number;
  amount: number;          // min 1000, max 100000000
  output_type: "string" | "image";
  unique_amount: boolean;  // default true
}

export interface GenerateQrisResponse {
  success: boolean;
  message: string;
  data: {
    history_id: number;
    qris_string?: string;
    original_amount: number;
    final_amount: number;
    payment_status: "unpaid" | "paid" | "expired" | "cancelled";
    expiry_time: string;
    qris_image?: string;   // base64 atau URL jika output_type=image
  };
}

export interface QrisPaymentStatusResponse {
  meta: {
    message: string;
    code: number;
    status: string;
  };
  data: {
    history_id: number;
    payment_status: "unpaid" | "paid" | "expired" | "cancelled";
    amount: number;
    name: string;
    paid_at: string | null;
    created_at: string;
    updated_at: string;
  };
}

// -------------------------------------------------------------
// Helper
// -------------------------------------------------------------

async function qrislyFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${QRISLY_BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "X-API-Key": QRISLY_API_KEY || "",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `QRISLY API error ${res.status}: ${text.slice(0, 300)}`
    );
  }

  return res.json();
}

// -------------------------------------------------------------
// Endpoints
// -------------------------------------------------------------

/**
 * POST /api/v1/qrisly/upload-qris
 * Upload QRIS image (multipart/form-data)
 *
 * NOTE: Di Next.js route handler kita gunakan FormData,
 * di sini kita buat helper yang menerima FormData langsung.
 */
export async function uploadQris(formData: FormData): Promise<QrisUploadResponse> {
  const url = `${QRISLY_BASE_URL}/api/v1/qrisly/upload-qris`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "X-API-Key": QRISLY_API_KEY || "",
      // Jangan set Content-Type agar browser/Next.js set boundary untuk multipart
    },
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `QRISLY API error ${res.status}: ${text.slice(0, 300)}`
    );
  }

  return res.json();
}

/**
 * POST /api/v1/qrisly/generate-qris
 * Generate dynamic QRIS untuk transaksi
 */
export async function generateQris(
  body: GenerateQrisRequest
): Promise<GenerateQrisResponse> {
  return qrislyFetch<GenerateQrisResponse>(
    "/api/v1/qrisly/generate-qris",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
}

/**
 * GET /api/v1/qrisly/payment-status/{history_id}
 * Cek status pembayaran QRIS
 */
export async function getQrisPaymentStatus(
  historyId: number
): Promise<QrisPaymentStatusResponse> {
  return qrislyFetch<QrisPaymentStatusResponse>(
    `/api/v1/qrisly/payment-status/${historyId}`,
    {
      method: "GET",
    }
  );
}