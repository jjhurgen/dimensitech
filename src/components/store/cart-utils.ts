"use client";

export type CartItem = {
  id: number;
  slug: string;
  brand: string;
  name: string;
  price: number;
  oldPrice: number | null;
  discountBadge: string | null;
  discountBadgeColor?: string | null;
  discountName: string | null;
  discountAmount: number | null;
  imageUrl: string | null;
  color: string | null;
  storage: string | null;
  ram: string | null;
  stock: number;
  quantity: number;
};

const CART_KEY = "dimensitech_cart";
export const CART_CHANGED_EVENT = "dimensitech-cart-changed";

export function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(CART_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeCart(items: CartItem[]) {
  window.localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(CART_CHANGED_EVENT));
}

export function addCartItem(item: Omit<CartItem, "quantity">, quantity = 1) {
  const current = readCart();
  const existing = current.find((entry) => entry.id === item.id);
  const max = Math.max(item.stock, 1);
  const next = existing
    ? current.map((entry) => entry.id === item.id ? { ...entry, quantity: Math.min(entry.quantity + quantity, max) } : entry)
    : [...current, { ...item, quantity: Math.min(quantity, max) }];
  writeCart(next);
}

export function updateCartQuantity(id: number, quantity: number) {
  if (quantity <= 0) {
    removeCartItem(id);
    return;
  }
  const next = readCart()
    .map((item) => item.id === id ? { ...item, quantity: Math.max(1, Math.min(quantity, Math.max(item.stock, 1))) } : item)
    .filter((item) => item.quantity > 0);
  writeCart(next);
}

export function removeCartItem(id: number) {
  writeCart(readCart().filter((item) => item.id !== id));
}

export function clearCart() {
  writeCart([]);
}
