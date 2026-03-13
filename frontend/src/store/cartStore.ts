import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartProduct {
    productId: string;
    name: string;
    price: number;
    image: string;
    category: string;
    size: string;
    condition: string;
    quantity: number;
}

interface CartState {
    items: CartProduct[];
    addItem: (item: Omit<CartProduct, 'quantity'>) => void;
    removeItem: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    total: () => number;
    itemCount: () => number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            addItem: (item) => {
                const existing = get().items.find((i) => i.productId === item.productId);
                if (existing) {
                    set({ items: get().items.map((i) => i.productId === item.productId ? { ...i, quantity: i.quantity + 1 } : i) });
                } else {
                    set({ items: [...get().items, { ...item, quantity: 1 }] });
                }
            },
            removeItem: (productId) => set({ items: get().items.filter((i) => i.productId !== productId) }),
            updateQuantity: (productId, quantity) => {
                if (quantity < 1) { set({ items: get().items.filter((i) => i.productId !== productId) }); return; }
                set({ items: get().items.map((i) => i.productId === productId ? { ...i, quantity } : i) });
            },
            clearCart: () => set({ items: [] }),
            total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
            itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
        }),
        { name: 'slick_cart' }
    )
);
