// =============================================================
// Cart Component — /components/pos/Cart.tsx
// Menampilkan item di cart, update qty, total, dan checkout (Caffeine Hub theme)
// =============================================================

import { Product } from '@/types/product';

export interface CartItem {
  product: Product;
  quantity: number;
}
interface Props {
  items: CartItem[];
  totalAmount: number;
  paymentMethod: "CASH" | "QRIS" | "TRANSFER";
  onPaymentMethodChange: (method: "CASH" | "QRIS" | "TRANSFER") => void;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
  checkoutLoading: boolean;
}

const formatRupiah = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);

const PAYMENT_METHODS = [
  { value: "CASH", label: "💵 Cash" },
  { value: "QRIS", label: "📱 QRIS" },
  { value: "TRANSFER", label: "🏦 Transfer" },
] as const;

export default function Cart({
  items,
  totalAmount,
  paymentMethod,
  onPaymentMethodChange,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
  checkoutLoading,
}: Props) {
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="flex flex-col h-full bg-white text-[#171717]">
      {/* ── Cart Header ────────────────────────────────────── */}
      <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-bold text-gray-800 flex items-center gap-2">
          🛒 Checkout Cart
          {itemCount > 0 && (
            <span className="bg-[#3f624c]/10 text-[#3f624c] text-xs px-2.5 py-0.5 rounded-full font-bold">
              {itemCount} items
            </span>
          )}
        </h2>
        {items.length > 0 && (
          <button
            id="btn-clear-cart"
            onClick={onClearCart}
            className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* ── Cart Items ─────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
            <span className="text-4xl mb-2">🛒</span>
            <p className="text-sm font-semibold text-center text-gray-500">
              Your cart is empty.
            </p>
            <p className="text-xs text-gray-400 text-center mt-1">
              Select products from the menu to start.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map(({ product, quantity }) => (
              <li key={product.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                {/* Info produk */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {product.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatRupiah(product.price)} / pcs
                  </p>
                </div>

                {/* Qty controls */}
                <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg p-0.5 shadow-sm">
                  <button
                    id={`btn-decrease-${product.id}`}
                    onClick={() => onUpdateQuantity(product.id, -1)}
                    className="w-6 h-6 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-100 flex items-center justify-center font-bold text-sm"
                  >
                    −
                  </button>
                  <span className="w-5 text-center text-xs font-bold text-gray-950">
                    {quantity}
                  </span>
                  <button
                    id={`btn-increase-${product.id}`}
                    onClick={() => onUpdateQuantity(product.id, 1)}
                    className="w-6 h-6 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-100 flex items-center justify-center font-bold text-sm"
                  >
                    +
                  </button>
                </div>

                {/* Subtotal */}
                <div className="text-right min-w-16">
                  <p className="text-sm font-bold text-gray-900">
                    {formatRupiah(product.price * quantity)}
                  </p>
                  <button
                    id={`btn-remove-${product.id}`}
                    onClick={() => onRemoveItem(product.id)}
                    className="text-[11px] font-semibold text-red-500 hover:underline mt-0.5"
                  >
                    remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Checkout Section ───────────────────────────────── */}
      <div className="border-t border-gray-200 p-4 space-y-4 bg-gray-50/50">
        {/* Total */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-500">Order Subtotal</span>
          <span className="text-xl font-extrabold text-gray-900">
            {formatRupiah(totalAmount)}
          </span>
        </div>

        {/* Metode Pembayaran */}
        <div>
          <p className="text-xs font-bold text-gray-400 mb-2 uppercase">Payment Method</p>
          <div className="grid grid-cols-3 gap-2">
            {PAYMENT_METHODS.map((pm) => (
              <button
                key={pm.value}
                id={`btn-payment-${pm.value.toLowerCase()}`}
                onClick={() => onPaymentMethodChange(pm.value)}
                className={`text-xs py-2.5 rounded-xl border text-center font-bold shadow-sm transition-all duration-200 ${
                  paymentMethod === pm.value
                    ? "bg-[#3f624c] border-[#3f624c] text-white"
                    : "bg-white border-gray-200 text-gray-600 hover:border-[#3f624c] hover:bg-gray-50"
                }`}
              >
                {pm.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tombol Checkout */}
        <button
          id="btn-checkout"
          onClick={onCheckout}
          disabled={items.length === 0 || checkoutLoading}
          className="w-full bg-[#3f624c] hover:bg-[#324f3c] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all duration-200 shadow-sm"
        >
          {checkoutLoading ? "Processing payment..." : `Process Checkout (${formatRupiah(totalAmount)})`}
        </button>
      </div>
    </div>
  );
}
