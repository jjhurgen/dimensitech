"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MouseEvent, PointerEvent, useEffect, useMemo, useRef, useState } from "react";
import { discountBadgeClass } from "@/lib/discount-badge-colors";
import type { StoreProduct } from "@/lib/storefront";
import { money } from "@/lib/utils";

export type StorePromotionBanner = {
  id: number;
  title: string;
  imageUrl: string;
  href: string;
};

type Slide =
  | {
      type: "banner";
      id: number;
      title: string;
      imageUrl: string;
      href: string;
    }
  | {
      type: "product";
      id: number;
      product: StoreProduct;
      href: string;
    };

export function FeaturedProductsCarousel({ products, banners = [] }: { products: StoreProduct[]; banners?: StorePromotionBanner[] }) {
  const slides = useMemo<Slide[]>(() => {
    if (banners.length) {
      return banners.map((banner) => ({
        type: "banner",
        id: banner.id,
        title: banner.title,
        imageUrl: banner.imageUrl,
        href: banner.href
      }));
    }

    return products
      .filter((product) => product.oldPrice && product.discountBadge)
      .slice(0, 8)
      .map((product) => ({
        type: "product",
        id: product.id,
        product,
        href: `/tienda/producto/${product.slug}`
      }));
  }, [banners, products]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragStartXRef = useRef(0);
  const dragOffsetRef = useRef(0);
  const dragPreventClickRef = useRef(false);
  const pointerDownRef = useRef(false);
  const showControls = slides.length > 1;
  const goToPrevious = () => setActiveIndex((index) => (index === 0 ? slides.length - 1 : index - 1));
  const goToNext = () => setActiveIndex((index) => (index === slides.length - 1 ? 0 : index + 1));

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!showControls || (event.target as HTMLElement).closest("button")) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();
    pointerDownRef.current = true;
    dragStartXRef.current = event.clientX;
    dragOffsetRef.current = 0;
    dragPreventClickRef.current = false;
    setIsPaused(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointerDownRef.current) return;
    const nextOffset = event.clientX - dragStartXRef.current;
    dragOffsetRef.current = nextOffset;
    if (Math.abs(nextOffset) > 8) {
      event.preventDefault();
      dragPreventClickRef.current = true;
      setIsDragging(true);
    }
    setDragOffset(nextOffset);
  };

  const finishDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointerDownRef.current) return;
    pointerDownRef.current = false;
    const width = viewportRef.current?.clientWidth ?? 1;
    const threshold = Math.min(120, Math.max(48, width * 0.16));

    const finalOffset = dragOffsetRef.current;
    if (Math.abs(finalOffset) >= threshold) {
      if (finalOffset < 0) {
        goToNext();
      } else {
        goToPrevious();
      }
    }

    dragOffsetRef.current = 0;
    setDragOffset(0);
    setIsDragging(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
    window.setTimeout(() => {
      dragPreventClickRef.current = false;
    }, 80);
  };

  const preventClickAfterDrag = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!dragPreventClickRef.current) return;
    event.preventDefault();
    event.stopPropagation();
  };

  useEffect(() => {
    setActiveIndex(0);
  }, [slides.length]);

  useEffect(() => {
    if (!showControls || isPaused) return;
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index === slides.length - 1 ? 0 : index + 1));
    }, 3000);
    return () => window.clearInterval(timer);
  }, [isPaused, showControls, slides.length]);

  if (!slides.length) return null;

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
      <div
        ref={viewportRef}
        className={`relative touch-pan-y overflow-hidden ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
      >
        <div
          className={`flex ease-out ${isDragging ? "" : "transition-transform duration-700"}`}
          style={{ transform: `translateX(calc(-${activeIndex * 100}% + ${dragOffset}px))` }}
        >
          {slides.map((slide, index) => (
            <div key={`${slide.type}-${slide.id}`} className="min-w-full">
              {slide.type === "banner" ? (
                <Link href={slide.href} draggable={false} onDragStart={(event) => event.preventDefault()} onClick={preventClickAfterDrag} className="relative block aspect-[1246/420] w-full select-none overflow-hidden bg-white">
                  <Image draggable={false} src={slide.imageUrl} alt={slide.title} fill sizes="(min-width: 1280px) 1280px, 100vw" className="select-none object-contain" priority={index === 0} />
                </Link>
              ) : (
                <Link href={slide.href} draggable={false} onDragStart={(event) => event.preventDefault()} onClick={preventClickAfterDrag} className="grid min-h-72 w-full select-none overflow-hidden bg-[#003f48] text-white sm:min-h-80 md:grid-cols-[1fr_260px] lg:min-h-96 xl:min-h-[420px]">
                  <div className="p-6 md:p-8">
                    <span className={discountBadgeClass(slide.product.discountBadgeColor)}>{slide.product.discountBadge}</span>
                    <p className="mt-5 text-xs font-black uppercase text-white/70">{slide.product.brand}</p>
                    <h3 className="mt-1 line-clamp-2 max-w-2xl text-3xl font-black leading-tight">{slide.product.name} {slide.product.storage}</h3>
                    <div className="mt-5">
                      <p className="text-sm font-bold text-white/60 line-through">{money(slide.product.oldPrice)}</p>
                      <p className="text-3xl font-black">{money(slide.product.price)}</p>
                      {slide.product.discountAmount ? <p className="mt-1 text-sm font-bold text-white/80">Ahorras {money(slide.product.discountAmount)}</p> : null}
                    </div>
                  </div>
                  <div className="relative hidden bg-white md:block">
                    {slide.product.imageUrl ? <Image draggable={false} src={slide.product.imageUrl} alt={slide.product.imageAlt ?? slide.product.name} fill sizes="260px" className="select-none object-contain p-6" /> : null}
                  </div>
                </Link>
              )}
            </div>
          ))}
        </div>

        {showControls ? (
          <>
            <button type="button" onClick={goToPrevious} aria-label="Banner anterior" className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#003f48] shadow-md ring-1 ring-slate-200 transition hover:bg-white">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" onClick={goToNext} aria-label="Banner siguiente" className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#003f48] shadow-md ring-1 ring-slate-200 transition hover:bg-white">
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
              {slides.map((slide, index) => (
                <button
                  key={`${slide.type}-${slide.id}`}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  aria-label={`Ir al banner ${index + 1}`}
                  className={`h-2.5 rounded-full transition ${index === activeIndex ? "w-7 bg-white" : "w-2.5 bg-white/60 hover:bg-white/80"}`}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
