// =============================================================
// Komerce Payment API Client
// Docs: https://api.collaborator.komerce.id/user
// Auth: header `x-api-key: YOUR_API_KEY`
// =============================================================

const KOMERCE_BASE_URL =
  process.env.KOMERCE_PAYMENT_BASE_URL ||
  "https://api-sandbox.collaborator.komerce.id/user";
const KOMERCE_API_KEY = process.env.KOMERCE_PAYMENT_API_KEY;

if (!KOMERCE_API_KEY) {
  console.warn("[komerce-payment] KOMERCE_PAYMENT_API_KEY belum di-set di .env");
}

// -------------------------------------------------------------
// Types
// -------------------------------------------------------------

export interface PaymentCustomer {
  name: string;
  email: string;
  phone: string;
}

export interface PaymentItem {
  name: string;
  quantity: number;
  price: number;
}

export interface CreatePaymentRequest {
  order_id: string;
  payment_type: "bank_transfer" | "qris";
  channel_code?: string;        // required untuk VA (BCA, BNI, dst)
  amount: number;               // min 10.000
  customer: PaymentCustomer;
  items: PaymentItem[];
  expiry_duration?: number;     // optional untuk VA, min 3600 detik (1 jam)
  callback_url?: string;
  callback_API_KEY?: string;    // required jika callback_url diisi
}

export interface CreatePaymentResponse {
  meta: {
    message: string;
    code: number;
    status: string;
  };
  data: {
    order_id: string;
    payment_id: string;
    payment_type: string;
    channel_code?: string;
    account_number?: string;    // VA number (untuk bank_transfer)
    va_number?: string;
    qr_string?: string;         // QRIS string (untuk QRIS)
    amount: number;
    status: "PENDING" | "PAID" | "EXPIRED" | "CANCELED";
    expiry_time?: string;
    token?: string;             // token untuk payment page
    payment_page_url?: string;  // URL halaman pembayaran
  };
}

export interface PaymentStatusResponse {
  meta: {
    message: string;
    code: number;
    status: string;
  };
  data: {
    order_id: string;
    payment_id: string;
    payment_type: string;
    channel_code?: string;
    amount: number;
    status: "PENDING" | "PAID" | "EXPIRED" | "CANCELED";
    paid_at?: string;
    paid_amount?: number;
    customer?: PaymentCustomer;
  };
}

export interface PaymentMethod {
  payment_type: "va" | "qris";
  display_name: string;
  bank_code: string;
  logo_url: string;
  min_amount: number;
  max_amount: number;
  currency: string;
}

export interface PaymentMethodsResponse {
  meta: {
    message: string;
    code: number;
    status: string;
  };
  data: PaymentMethod[];
}

export interface CancelPaymentRequest {
  payment_id: string;
  reason: string;
}

export interface CancelPaymentResponse {
  meta: {
    message: string;
    code: number;
    status: string;
  };
  data: {
    payment_id: string;
    status: string;
  };
}

// -------------------------------------------------------------
// Helper
// -------------------------------------------------------------

async function komerceFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${KOMERCE_BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "x-api-key": KOMERCE_API_KEY || "",
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Komerce Payment API error ${res.status}: ${text.slice(0, 300)}`
    );
  }

  return res.json();
}

// -------------------------------------------------------------
// Endpoints
// -------------------------------------------------------------

/**
 * GET /api/v1/user/methods
 * Ambil daftar metode pembayaran tersedia (VA banks + QRIS)
 */
export async function getPaymentMethods(): Promise<PaymentMethodsResponse> {
  return komerceFetch<PaymentMethodsResponse>("/api/v1/user/methods", {
    method: "GET",
  });
}

/**
 * POST /api/v1/user/payment/create
 * Buat transaksi pembayaran (VA atau QRIS)
 */
export async function createPayment(
  body: CreatePaymentRequest
): Promise<CreatePaymentResponse> {
  return komerceFetch<CreatePaymentResponse>(
    "/api/v1/user/payment/create",
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
}

/**
 * GET /api/v1/user/payment/status/{payment_id}
 * Cek status pembayaran
 * Rate limit: maks 1 request per 3 detik per payment_id
 */
export async function getPaymentStatus(
  paymentId: string
): Promise<PaymentStatusResponse> {
  return komerceFetch<PaymentStatusResponse>(
    `/api/v1/user/payment/status/${encodeURIComponent(paymentId)}`,
    {
      method: "GET",
    }
  );
}

/**
 * POST /api/v1/user/payment/cancel
 * Batalkan pembayaran yang masih PENDING
 */
export async function cancelPayment(
  body: CancelPaymentRequest
): Promise<CancelPaymentResponse> {
  return komerceFetch<CancelPaymentResponse>(
    "/api/v1/user/payment/cancel",
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
}