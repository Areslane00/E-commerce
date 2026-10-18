import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Product, CartItem } from "@/types";

interface CartStore {
  items: CartItem[];
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (product: Product, quantity?: number) => { success: boolean; message: string };
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isCartOpen: false,

      openCart: () => set({ isCartOpen: true }),
      closeCart: () => set({ isCartOpen: false }),
      toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),

      addItem: (product: Product, quantity = 1) => {
        if (product.stock <= 0) {
          return { success: false, message: "Ce produit est épuisé" };
        }

        const items = get().items;
        const existingIndex = items.findIndex((i) => i.product.id === product.id);

        if (existingIndex > -1) {
          const currentQty = items[existingIndex].quantity;
          const newQty = currentQty + quantity;

          if (newQty > product.stock) {
            return {
              success: false,
              message: `Stock maximum atteint (${product.stock} disponibles)`,
            };
          }

          const updatedItems = [...items];
          updatedItems[existingIndex] = {
            ...updatedItems[existingIndex],
            quantity: newQty,
            product, // Mettre à jour les données produit les plus fraîches
          };

          set({ items: updatedItems });
          return { success: true, message: "Quantité mise à jour dans le panier" };
        } else {
          if (quantity > product.stock) {
            return {
              success: false,
              message: `Seulement ${product.stock} articles disponibles`,
            };
          }

          set({
            items: [...items, { product, quantity }],
          });
          return { success: true, message: "Produit ajouté au panier" };
        }
      },

      updateQuantity: (productId: string, quantity: number) => {
        const items = get().items;
        if (quantity <= 0) {
          set({ items: items.filter((i) => i.product.id !== productId) });
          return;
        }

        const item = items.find((i) => i.product.id === productId);
        if (!item) return;

        // Limite au stock réel disponible
        const maxStock = item.product.stock;
        const validQty = Math.min(quantity, maxStock);

        set({
          items: items.map((i) =>
            i.product.id === productId ? { ...i, quantity: validQty } : i
          ),
        });
      },

      removeItem: (productId: string) => {
        set({
          items: get().items.filter((i) => i.product.id !== productId),
        });
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
      },
    }),
    {
      name: "ecommerce-cart-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
);
