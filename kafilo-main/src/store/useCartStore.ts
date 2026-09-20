import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  variants?: string;
  isReward?: boolean;       // Menandakan ini barang gratisan
  originalPrice?: number;   // Menyimpan harga asli untuk dicoret di UI
}

export interface RedeemedReward {
  id: string;
  name: string;
  originalPrice: number;
  pointsCost: number;
  image: string | null;
}

interface CartState {
  cart: CartItem[];
  redeemedRewards: RedeemedReward[]; // Menyimpan tombol "Gunakan"
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  addRedeemedReward: (reward: RedeemedReward) => void;
  removeRedeemedReward: (id: string) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: [],
      redeemedRewards: [], // Awalnya kosong
      addToCart: (item) => {
        const { cart } = get();
        const existing = cart.find((i) => i.id === item.id);
        if (existing) {
          set({
            cart: cart.map((i) =>
              i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
            ),
          });
        } else {
          set({ cart: [...cart, item] });
        }
      },
      removeFromCart: (id) =>
        set((state) => ({ cart: state.cart.filter((i) => i.id !== id) })),
      updateQuantity: (id, quantity) =>
        set((state) => ({
          cart: state.cart.map((i) => (i.id === id ? { ...i, quantity } : i)),
        })),
      clearCart: () => set({ cart: [] }),
      
      // Aksi untuk alur Reward
      addRedeemedReward: (reward) => set((state) => ({
        redeemedRewards: [...state.redeemedRewards, reward]
      })),
      removeRedeemedReward: (id) => set((state) => ({
        redeemedRewards: state.redeemedRewards.filter((r) => r.id !== id)
      })),
    }),
    { name: 'kofilo-cart-storage' }
  )
);