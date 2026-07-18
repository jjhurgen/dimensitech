"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Truck } from "lucide-react";
import { AddToCartButton } from "@/components/store/add-to-cart-button";
import { ColorVariantLinks } from "@/components/store/color-variant-links";
import { trackStoreAnalytics } from "@/components/store/store-analytics-tracker";
import { discountBadgeClass } from "@/lib/discount-badge-colors";
import { StoreProduct } from "@/lib/storefront";
import { money } from "@/lib/utils";

export function ProductCard({ product, compact = false }: { product: StoreProduct; compact?: boolean }) {
  const requestOnly = product.isRequestOnly;
  const out = product.stock <= 0 && !requestOnly;
  const hasColorVariants = product.colorVariants.length > 1;
  const requestLabel = product.requestDeliveryDays
    ? `Llega en ${product.requestDeliveryDays} dia${product.requestDeliveryDays === 1 ? "" : "s"}`
    : "A pedido";
  const cartItem = {
    id: product.id,
    slug: product.slug,
    brand: product.brand,
    name: product.name,
    price: product.price,
    oldPrice: product.oldPrice,
    discountBadge: product.discountBadge,
    discountBadgeColor: product.discountBadgeColor,
    discountName: product.discountName,
    discountAmount: product.discountAmount,
    imageUrl: product.imageUrl,
    color: product.color,
    storage: product.storage,
    ram: product.ram,
    stock: product.stock
  };

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md">
      <Link href={`/tienda/producto/${product.slug}`} onClick={() => trackStoreAnalytics("product_click", product.id)} className="relative block aspect-square overflow-hidden bg-white">
        {product.isPhone && (product.storage || product.ram) ? (
          <div className="absolute left-3 top-3 z-10 flex flex-col items-start gap-1">
            {product.storage ? <span className="rounded bg-[#003f48] px-2 py-1 text-[11px] font-black text-white shadow-sm">{product.storage}</span> : null}
            {product.ram ? <span className="rounded bg-[#098d8f] px-2 py-1 text-[11px] font-black text-white shadow-sm">{product.ram}</span> : null}
            {product.discountBadge ? <span className={discountBadgeClass(product.discountBadgeColor, "text-[11px]")}>{product.discountBadge}</span> : null}
            {requestOnly ? <span className="rounded border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-black text-amber-700 shadow-sm">A pedido</span> : null}
          </div>
        ) : product.discountBadge ? (
          <div className="absolute left-3 top-3 z-10">
            <span className={discountBadgeClass(product.discountBadgeColor, "text-[11px]")}>{product.discountBadge}</span>
          </div>
        ) : requestOnly ? (
          <div className="absolute left-3 top-3 z-10">
            <span className="rounded border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-black text-amber-700 shadow-sm">A pedido</span>
          </div>
        ) : null}
        {requestOnly ? <span className="absolute right-3 top-3 z-10 rounded border border-slate-200 bg-white/95 px-2 py-1 text-[11px] font-black text-slate-700 shadow-sm">{requestLabel}</span> : null}
        {product.imageUrl ? (
          <Image src={product.imageUrl} alt={product.imageAlt ?? product.name} fill sizes={compact ? "(min-width: 1280px) 20vw, (min-width: 768px) 25vw, 50vw" : "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 50vw"} className={`object-contain transition duration-300 group-hover:scale-[1.03] ${compact ? "p-3 sm:p-4" : "p-4 sm:p-7"} ${out ? "grayscale" : ""}`} />
        ) : (
          <div className="grid h-full place-items-center p-6 text-center text-sm font-black text-slate-500">DIMENSITECH<br /><span className="text-xs font-medium">Imagen no disponible</span></div>
        )}
        {out ? <div className="absolute inset-0 bg-white/55" /> : null}
      </Link>

      <div className={`flex flex-1 flex-col ${compact ? "p-2.5" : "p-2.5 sm:p-3.5"}`}>
        <div>
          <p className="text-xs font-black uppercase text-slate-500">{product.brand}</p>
          <Link href={`/tienda/producto/${product.slug}`} onClick={() => trackStoreAnalytics("product_click", product.id)} className={`mt-1 line-clamp-2 font-semibold text-slate-900 hover:text-[#098d8f] ${compact ? "min-h-8 text-xs leading-4" : "min-h-9 text-xs leading-4 sm:min-h-10 sm:text-sm sm:leading-5"}`}>
            {product.name} {product.storage} {hasColorVariants ? "" : product.color}
          </Link>
          {hasColorVariants ? (
            <div className="mt-2 space-y-1">
              <ColorVariantLinks variants={product.colorVariants} currentId={product.id} />
              <p className="text-[11px] font-semibold text-slate-500">{product.color ?? "Color seleccionado"}</p>
            </div>
          ) : null}
        </div>

        <div className="mt-2">
          <p className="text-[11px] font-bold uppercase text-slate-500">Precio online</p>
          {product.oldPrice ? <p className="text-xs font-bold text-slate-400 line-through">{money(product.oldPrice)}</p> : null}
          <p className={`mt-0.5 font-black tracking-tight text-slate-950 ${compact ? "text-lg" : "text-xl sm:text-2xl"}`}>{money(product.price)}</p>
          <p className={`mt-1 text-xs font-bold ${out ? "text-slate-500" : "text-[#098d8f]"}`}>
            {product.stock > 0 ? `${product.stock} unidades disponibles` : requestOnly ? requestLabel : "Consulta disponibilidad"}
          </p>
        </div>

        {compact ? null : (
          <div className="mt-3 flex items-center gap-1.5 border-t border-slate-100 pt-3 text-[11px] font-semibold text-slate-600 sm:gap-2 sm:text-xs">
            <Truck className="h-3.5 w-3.5 shrink-0 text-slate-500 sm:h-4 sm:w-4" />
            {requestOnly ? "Entrega estimada a Huaraz" : out ? "Disponible bajo consulta" : "Envios a Lima y provincias"}
          </div>
        )}

        <div className={`mt-auto grid gap-2 ${compact ? "pt-2" : "pt-3"}`}>
          {requestOnly ? (
            <Link href={`/tienda/producto/${product.slug}`} onClick={() => trackStoreAnalytics("product_click", product.id)} className={`inline-flex items-center justify-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2 font-bold text-amber-700 shadow-sm transition hover:border-amber-300 hover:bg-amber-100 ${compact ? "h-8 text-[11px]" : "h-9 text-xs sm:h-10 sm:gap-2 sm:px-3 sm:text-sm"}`}>
              Ver pedido
            </Link>
          ) : (
            <AddToCartButton item={cartItem} disabled={out} className={`inline-flex items-center justify-center gap-1.5 rounded-md border border-[#098d8f] bg-white px-2 font-bold text-[#098d8f] shadow-sm transition group-hover:bg-[#098d8f] group-hover:text-white disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-100 disabled:text-slate-400 ${compact ? "h-8 text-[11px]" : "h-9 text-xs sm:h-10 sm:gap-2 sm:px-3 sm:text-sm"}`}>
              <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Anadir al carrito
            </AddToCartButton>
          )}
          <div>
            <Link href={`/tienda/producto/${product.slug}`} onClick={() => trackStoreAnalytics("product_click", product.id)} className={`flex items-center justify-center rounded-md border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 ${compact ? "h-8 text-xs" : "h-9 text-sm"}`}>
              Ver detalle
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
