"use client";

import { ReactNode, useState } from "react";
import { addCartItem, CartItem } from "@/components/store/cart-utils";
import { trackStoreAnalytics } from "@/components/store/store-analytics-tracker";

export function AddToCartButton({
  item,
  disabled,
  className,
  children
}: {
  item: Omit<CartItem, "quantity">;
  disabled?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  const [added, setAdded] = useState(false);

  return (
    <button
      type="button"
      disabled={disabled}
      className={className}
      onClick={() => {
        addCartItem(item);
        trackStoreAnalytics("add_to_cart", item.id);
        setAdded(true);
        window.setTimeout(() => setAdded(false), 1400);
      }}
    >
      {added ? "Añadido" : children}
    </button>
  );
}
