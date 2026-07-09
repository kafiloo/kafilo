// =============================================================
// RajaOngkir Shipping Cost API Client
// Docs: https://rajaongkir.komerce.id/api/v1
// Auth: header `key: YOUR_API_KEY`
// =============================================================

const RAJAONGKIR_BASE_URL =
  process.env.RAJAONGKIR_BASE_URL || "https://rajaongkir.komerce.id/api/v1";
const RAJAONGKIR_API_KEY = process.env.RAJAONGKIR_API_KEY;

if (!RAJAONGKIR_API_KEY) {
  console.warn("[rajaongkir] RAJAONGKIR_API_KEY belum di-set di .env");
}

// -------------------------------------------------------------
// Types
// -------------------------------------------------------------

export interface DomesticCostRequest {
  origin: number;        // ID destinasi asal (dari search domestic-destination)
  destination: number;   // ID destinasi tujuan
  weight: number;        // gram (1kg = 1000g)
  courier: string;       // kode kurir: jne, jnt, sicepat, pos, etc.
  price?: boolean;       // true = lowest, false = highest
}

export interface CourierService {
  name: string;
  code: string;
  service: string;
  description: string;
  cost: number;
  etd: string;
}

export interface DomesticCostResponse {
  meta: {
    message: string;
    code: number;
    status: string;
  };
  data: CourierService[];
}

export interface DestinationItem {
  label: string;
  value: {
    label: string;
    subdistrict: string;
    city: string;
    province: string;
  };
}

// -------------------------------------------------------------
// Helper
// -------------------------------------------------------------

async function rajaOngkirFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${RAJAONGKIR_BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      key: RAJAONGKIR_API_KEY || "",
      "Content-Type": "application/x-www-form-urlencoded",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `RajaOngkir API error ${res.status}: ${text.slice(0, 300)}`
    );
  }

  return res.json();
}

// -------------------------------------------------------------
// Endpoints
// -------------------------------------------------------------

/**
 * Cari destination domestik (provinsi/kota/kecamatan/kelurahan)
 * GET /destination/domestic-destination?query=...
 */
export async function searchDomesticDestination(
  query: string
): Promise<DestinationItem[]> {
  const url = `/destination/domestic-destination?query=${encodeURIComponent(query)}`;
  const result = await rajaOngkirFetch<{ data: DestinationItem[] }>(url);
  return result.data ?? [];
}

/**
 * Hitung ongkos kirim domestik
 * POST /calculate/domestic-cost
 * Body: application/x-www-form-urlencoded
 */
export async function calculateDomesticCost(
  body: DomesticCostRequest
): Promise<DomesticCostResponse> {
  const form = new URLSearchParams();
  form.set("origin", String(body.origin));
  form.set("destination", String(body.destination));
  form.set("weight", String(body.weight));
  form.set("courier", body.courier);
  if (body.price !== undefined) {
    form.set("price", body.price ? "true" : "false");
  }

  return rajaOngkirFetch<DomesticCostResponse>(
    "/calculate/domestic-cost",
    {
      method: "POST",
      body: form.toString(),
    }
  );
}

/**
 * Cari destinasi internasional
 * GET /destination/international-destination?query=...
 */
export async function searchInternationalDestination(
  query: string
): Promise<DestinationItem[]> {
  const url = `/destination/international-destination?query=${encodeURIComponent(query)}`;
  const result = await rajaOngkirFetch<{ data: DestinationItem[] }>(url);
  return result.data ?? [];
}

/**
 * Hitung ongkos kirim internasional
 * POST /calculate/international-cost
 */
export async function calculateInternationalCost(
  body: DomesticCostRequest
): Promise<DomesticCostResponse> {
  const form = new URLSearchParams();
  form.set("origin", String(body.origin));
  form.set("destination", String(body.destination));
  form.set("weight", String(body.weight));
  form.set("courier", body.courier);
  if (body.price !== undefined) {
    form.set("price", body.price ? "true" : "false");
  }

  return rajaOngkirFetch<DomesticCostResponse>(
    "/calculate/international-cost",
    {
      method: "POST",
      body: form.toString(),
    }
  );
}

/**
 * Tracking AWB (Air Waybill)
 * POST /track/waybill
 * Body x-www-form-urlencoded: waybill, courier
 */
export async function trackWaybill(params: {
  waybill: string;
  courier: string;
}): Promise<any> {
  const form = new URLSearchParams();
  form.set("waybill", params.waybill);
  form.set("courier", params.courier);

  return rajaOngkirFetch<any>("/track/waybill", {
    method: "POST",
    body: form.toString(),
  });
}