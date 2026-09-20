// =============================================================
// ProductGrid Component — /components/pos/ProductGrid.tsx
// Menampilkan grid kartu produk (Caffeine Hub theme)
// =============================================================

import { Product } from '@/types/product';

interface Props {
  products: Product[];
  onAddToCart: (product: Product) => void;
}

const formatRupiah = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);

export default function ProductGrid({ products, onAddToCart }: Props) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <span className="text-4xl mb-2">🍽️</span>
        <p className="text-sm font-semibold">No products available</p>
        <p className="text-xs text-gray-400 mt-1">Please add items from the admin CMS panel.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map((product) => (
        <button
          key={product.id}
          id={`product-card-${product.id}`}
          onClick={() => onAddToCart(product)}
          disabled={!product.isAvailable}
          className={`
            bg-white rounded-2xl border text-left overflow-hidden transition-all duration-200 shadow-sm flex flex-col justify-between
            ${product.isAvailable
              ? "border-gray-200 hover:border-[#3f624c] hover:shadow-md cursor-pointer hover:-translate-y-0.5"
              : "border-gray-100 opacity-60 cursor-not-allowed"
            }
          `}
        >
          {/* Gambar Produk */}
          <div className="relative w-full aspect-[4/3] bg-gray-50 flex items-center justify-center text-3xl select-none">
            {product.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              "☕"
            )}

            {/* Badge tidak tersedia / Sold out */}
            {!product.isAvailable && (
              <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                <span className="text-white text-[10px] font-extrabold uppercase tracking-wider bg-red-600 px-2.5 py-1 rounded-full shadow-sm">
                  Sold Out
                </span>
              </div>
            )}
          </div>

          {/* Info Produk */}
          <div className="p-3.5 flex-1 flex flex-col justify-between">
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5">
                {product.category?.name}
              </p>
              <h4 className="text-sm font-bold text-gray-900 line-clamp-2 leading-tight">
                {product.name}
              </h4>
            </div>
            
            <div className="flex items-baseline justify-between mt-3 pt-2 border-t border-gray-50">
              <span className="text-xs text-gray-400 font-semibold">Price</span>
              <p className="text-sm font-extrabold text-[#3f624c]">
                {formatRupiah(product.price)}
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
