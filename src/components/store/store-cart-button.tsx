"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { CART_CHANGED_EVENT, CartItem, clearCart, readCart, removeCartItem, updateCartQuantity } from "@/components/store/cart-utils";
import { discountBadgeClass } from "@/lib/discount-badge-colors";
import { money } from "@/lib/utils";

type StoreShippingType = "STORE_PICKUP" | "LIMA" | "PROVINCE" | "DELIVERY";

export function StoreCartButton() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<CartItem[]>([]);
  const [shippingType, setShippingType] = useState<StoreShippingType>("STORE_PICKUP");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);

  function refresh() {
    setItems(readCart());
  }

  useEffect(() => {
    refresh();
    window.addEventListener(CART_CHANGED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(CART_CHANGED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!items.length || loading) return;
    setLoading(true);
    setError("");
    const whatsappWindow = window.open("about:blank", "_blank");

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/store/cart-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: formData.get("customerName"),
        customerPhone: formData.get("customerPhone"),
        customerDni: formData.get("customerDni"),
        shippingType,
        destinationDepartment: formData.get("destinationDepartment"),
        destinationProvince: formData.get("destinationProvince"),
        destinationCity: formData.get("destinationCity"),
        addressReference: formData.get("addressReference"),
        notes: formData.get("notes"),
        items: items.map((item) => ({ productSkuId: item.id, quantityRequested: item.quantity }))
      })
    });
    const result = await response.json();
    setLoading(false);

    if (!response.ok) {
      whatsappWindow?.close();
      setError(result.error ?? "No se pudo crear el pedido");
      return;
    }

    clearCart();
    setOpen(false);
    if (whatsappWindow) {
      whatsappWindow.opener = null;
      whatsappWindow.location.href = result.whatsappUrl;
    } else {
      window.location.href = result.whatsappUrl;
    }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="relative grid h-10 w-10 place-items-center rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50" aria-label="Abrir carrito">
        <ShoppingBag className="h-5 w-5" />
        {totalItems > 0 ? (
          <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-[#098d8f] px-1 text-[11px] font-black text-white">
            {totalItems}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50">
          <button className="absolute inset-0 bg-slate-950/50" onClick={() => setOpen(false)} aria-label="Cerrar carrito" />
          <aside className="absolute inset-y-0 right-0 flex w-[92vw] max-w-md flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-4">
              <div>
                <h2 className="text-lg font-black text-slate-950">Carrito</h2>
                <p className="text-sm font-medium text-slate-500">{totalItems} producto(s)</p>
              </div>
              <button onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-md bg-slate-100 hover:bg-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {items.length ? (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="grid grid-cols-[72px_1fr] gap-3 rounded-lg border border-slate-200 p-3">
                      <Link href={`/tienda/producto/${item.slug}`} onClick={() => setOpen(false)} className="relative aspect-square overflow-hidden rounded-md bg-white">
                        {item.imageUrl ? <Image src={item.imageUrl} alt={item.name} fill sizes="72px" className="object-contain p-2" /> : <div className="grid h-full place-items-center text-xs font-bold text-slate-500">DS</div>}
                      </Link>
                      <div className="min-w-0">
                        <p className="text-xs font-black uppercase text-slate-500">{item.brand}</p>
                        <Link href={`/tienda/producto/${item.slug}`} onClick={() => setOpen(false)} className="line-clamp-2 text-sm font-bold text-slate-900 hover:text-[#098d8f]">
                          {item.name} {item.storage} {item.color}
                        </Link>
                        {item.discountBadge ? (
                          <p className="mt-1 flex flex-wrap items-center gap-1.5">
                            <span className={discountBadgeClass(item.discountBadgeColor, "text-[10px]")}>{item.discountBadge}</span>
                            {item.discountName ? <span className="text-xs font-bold text-slate-500">{item.discountName}</span> : null}
                          </p>
                        ) : null}
                        {item.oldPrice ? <p className="mt-1 text-xs font-bold text-slate-400 line-through">{money(item.oldPrice)}</p> : null}
                        <p className="mt-1 text-sm font-black text-slate-950">{money(item.price)}</p>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <div className="inline-flex h-8 items-center rounded-md border border-slate-200">
                            <button className="grid h-8 w-8 place-items-center text-slate-600 hover:bg-slate-50" onClick={() => updateCartQuantity(item.id, item.quantity - 1)}>
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="min-w-8 text-center text-sm font-bold">{item.quantity}</span>
                            <button className="grid h-8 w-8 place-items-center text-slate-600 hover:bg-slate-50" onClick={() => updateCartQuantity(item.id, item.quantity + 1)}>
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <button onClick={() => removeCartItem(item.id)} className="grid h-8 w-8 place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-[#003f48]" aria-label="Quitar producto">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid min-h-80 place-items-center rounded-lg border border-dashed border-slate-200 p-6 text-center">
                  <div>
                    <ShoppingBag className="mx-auto h-10 w-10 text-slate-300" />
                    <p className="mt-3 font-black text-slate-900">Tu carrito está vacío</p>
                    <p className="mt-1 text-sm text-slate-500">Añade productos desde el catálogo.</p>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={submitOrder} className="border-t border-slate-200 p-4">
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="font-bold text-slate-500">Subtotal</span>
                <span className="text-xl font-black text-slate-950">{money(subtotal)}</span>
              </div>
              <div className="mb-3 grid gap-2">
                <div className="grid gap-2 sm:grid-cols-2">
                  <input name="customerName" required placeholder="Nombre completo" className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-[#098d8f]" />
                  <input name="customerPhone" required placeholder="WhatsApp" className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-[#098d8f]" />
                </div>
                <input name="customerDni" placeholder="DNI o RUC opcional" className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-[#098d8f]" />
                <select value={shippingType} onChange={(event) => setShippingType(event.target.value as StoreShippingType)} className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-[#098d8f]">
                  <option value="STORE_PICKUP">Recojo en tienda</option>
                  <option value="LIMA">Envio a Lima</option>
                  <option value="DELIVERY">Delivery en Huaraz</option>
                  <option value="PROVINCE">Envio a provincia</option>
                </select>
                {shippingType === "LIMA" ? (
                  <div className="grid gap-2">
                    <input name="destinationCity" required placeholder="Distrito" className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-[#098d8f]" />
                    <input name="addressReference" required placeholder="Direccion y referencia" className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-[#098d8f]" />
                  </div>
                ) : null}
                {shippingType === "PROVINCE" ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input name="destinationDepartment" required placeholder="Departamento" className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-[#098d8f]" />
                    <input name="destinationProvince" required placeholder="Provincia" className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-[#098d8f]" />
                    <input name="destinationCity" required placeholder="Ciudad" className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-[#098d8f] sm:col-span-2" />
                    <input name="addressReference" required placeholder="Direccion y referencia" className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-[#098d8f] sm:col-span-2" />
                  </div>
                ) : null}
                {shippingType === "DELIVERY" ? (
                  <input name="addressReference" required placeholder="Direccion y referencia en Huaraz" className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-[#098d8f]" />
                ) : null}
                <textarea name="notes" placeholder="Notas del pedido opcional" className="min-h-16 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#098d8f]" />
                {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p> : null}
                <p className="text-xs font-medium text-slate-500">Al continuar se generara una reserva web, se apartara el stock y se abrira WhatsApp con el detalle del pedido.</p>
              </div>
              <div className="grid gap-2">
                <button type="submit" disabled={!items.length || loading} className="inline-flex h-11 items-center justify-center rounded-md bg-[#098d8f] px-4 text-sm font-bold text-white hover:bg-[#003f48] disabled:cursor-not-allowed disabled:bg-slate-300">
                  {loading ? "Generando pedido..." : "Comprar por WhatsApp"}
                </button>
                <button type="button" onClick={clearCart} disabled={!items.length} className="h-10 rounded-md border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300">
                  Vaciar carrito
                </button>
              </div>
            </form>
          </aside>
        </div>
      ) : null}
    </>
  );
}
