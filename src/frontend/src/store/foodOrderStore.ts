import { create } from "zustand";

export interface CartItem {
  menuItemId: string;
  itemName: string;
  priceCents: number;
  quantity: number;
}

interface FoodOrderStore {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">) => void;
  removeFromCart: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
}

export const useFoodOrderStore = create<FoodOrderStore>((set) => ({
  cartItems: [],

  addToCart: (item) =>
    set((state) => {
      const existing = state.cartItems.find(
        (c) => c.menuItemId === item.menuItemId,
      );
      if (existing) {
        return {
          cartItems: state.cartItems.map((c) =>
            c.menuItemId === item.menuItemId
              ? { ...c, quantity: c.quantity + 1 }
              : c,
          ),
        };
      }
      return { cartItems: [...state.cartItems, { ...item, quantity: 1 }] };
    }),

  removeFromCart: (menuItemId) =>
    set((state) => ({
      cartItems: state.cartItems.filter((c) => c.menuItemId !== menuItemId),
    })),

  updateQuantity: (menuItemId, quantity) =>
    set((state) => {
      if (quantity <= 0) {
        return {
          cartItems: state.cartItems.filter((c) => c.menuItemId !== menuItemId),
        };
      }
      return {
        cartItems: state.cartItems.map((c) =>
          c.menuItemId === menuItemId ? { ...c, quantity } : c,
        ),
      };
    }),

  clearCart: () => set({ cartItems: [] }),
}));
