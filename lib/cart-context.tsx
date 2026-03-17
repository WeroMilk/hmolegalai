"use client";

import React, { createContext, useContext, useCallback, useEffect, useState } from "react";
import { getProductById } from "@/lib/products";

const CART_STORAGE_KEY = "vitahealth_cart";

export interface CartItem {
  productId: string;
  quantity: number;
  isSubscription?: boolean;
  /** Cuando el plan de dieta se añade desde el formulario de consulta. */
  consultaId?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (productId: string, isSubscription?: boolean) => void;
  updateQuantity: (productId: string, quantity: number, isSubscription?: boolean) => void;
  clearCart: () => void;
  totalItems: number;
  totalPriceCentavos: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function loadFromStorage(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveToStorage(items: CartItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setItems(loadFromStorage());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    saveToStorage(items);
  }, [items, mounted]);

  const addItem = useCallback(
    (item: Omit<CartItem, "quantity"> & { quantity?: number }) => {
      const qty = Math.min(10, Math.max(1, item.quantity ?? 1));
      setItems((prev) => {
        const existing = prev.findIndex((i) => i.productId === item.productId && i.isSubscription === item.isSubscription);
        if (existing >= 0) {
          const next = [...prev];
          next[existing] = { ...next[existing], quantity: Math.min(10, next[existing].quantity + qty) };
          return next;
        }
        return [...prev, { ...item, quantity: qty } as CartItem];
      });
    },
    []
  );

  const removeItem = useCallback((productId: string, isSubscription?: boolean) => {
    setItems((prev) =>
      prev.filter((i) => !(i.productId === productId && (i.isSubscription ?? false) === (isSubscription ?? false)))
    );
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number, isSubscription?: boolean) => {
    const qty = Math.min(10, Math.max(0, quantity));
    const sub = isSubscription ?? false;
    setItems((prev) => {
      if (qty === 0) return prev.filter((i) => !(i.productId === productId && (i.isSubscription ?? false) === sub));
      return prev.map((i) =>
        i.productId === productId && (i.isSubscription ?? false) === sub ? { ...i, quantity: qty } : i
      );
    });
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((acc, i) => acc + i.quantity, 0);

  const totalPriceCentavos = items.reduce((acc, i) => {
    const product = getProductById(i.productId);
    if (!product) return acc;
    const price = i.isSubscription ? product.priceSubscription : product.priceOneTime;
    return acc + price * i.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPriceCentavos,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
