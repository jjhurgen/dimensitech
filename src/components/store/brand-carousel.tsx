"use client";

import Link from "next/link";
import { MouseEvent, PointerEvent, useEffect, useRef, useState } from "react";

const brands = [
  { name: "Apple", slug: "apple", logo: "/uploads/brands/apple_logo.png" },
  { name: "Samsung", slug: "samsung", logo: "/uploads/brands/samsung_logo.png" },
  { name: "Xiaomi", slug: "xiaomi", logo: "/uploads/brands/xiaomi_logo.png" },
  { name: "Poco", slug: "poco", logo: "/uploads/brands/poco_logo.png" },
  { name: "Honor", slug: "honor", logo: "/uploads/brands/honor_logo.png" },
  { name: "Infinix", slug: "infinix", logo: "/uploads/brands/infinix_logo.png" },
  { name: "Motorola", slug: "motorola", logo: "/uploads/brands/motorola_logo.png" }
];

const carouselBrands = [...brands, ...brands];

export function BrandCarousel() {
  const [failedLogos, setFailedLogos] = useState<Record<string, boolean>>({});
  const scrollerRef = useRef<HTMLDivElement>(null);
  const dragStartXRef = useRef(0);
  const dragStartScrollRef = useRef(0);
  const dragPreventClickRef = useRef(false);
  const pointerDownRef = useRef(false);
  const touchResumeTimerRef = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const markLogoAsFailed = (slug: string) => {
    setFailedLogos((current) => (current[slug] ? current : { ...current, [slug]: true }));
  };

  const normalizeScroll = () => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const halfWidth = scroller.scrollWidth / 2;
    if (halfWidth <= 0) return;
    if (scroller.scrollLeft >= halfWidth) scroller.scrollLeft -= halfWidth;
    if (scroller.scrollLeft <= 0) scroller.scrollLeft += halfWidth;
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (event.pointerType !== "mouse") {
      setIsPaused(true);
      return;
    }
    event.preventDefault();
    pointerDownRef.current = true;
    dragStartXRef.current = event.clientX;
    dragStartScrollRef.current = scroller.scrollLeft;
    dragPreventClickRef.current = false;
    setIsPaused(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const scroller = scrollerRef.current;
    if (!scroller || !pointerDownRef.current) return;
    const delta = event.clientX - dragStartXRef.current;
    if (Math.abs(delta) > 6) {
      event.preventDefault();
      dragPreventClickRef.current = true;
      setIsDragging(true);
    }
    scroller.scrollLeft = dragStartScrollRef.current - delta;
  };

  const finishDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointerDownRef.current) return;
    pointerDownRef.current = false;
    normalizeScroll();
    setIsDragging(false);
    setIsPaused(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
    window.setTimeout(() => {
      dragPreventClickRef.current = false;
    }, 80);
  };

  const pauseForTouch = () => {
    if (touchResumeTimerRef.current) window.clearTimeout(touchResumeTimerRef.current);
    setIsPaused(true);
  };

  const resumeAfterTouch = () => {
    normalizeScroll();
    if (touchResumeTimerRef.current) window.clearTimeout(touchResumeTimerRef.current);
    touchResumeTimerRef.current = window.setTimeout(() => {
      setIsPaused(false);
    }, 700);
  };

  const preventClickAfterDrag = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!dragPreventClickRef.current) return;
    event.preventDefault();
    event.stopPropagation();
  };

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (scroller && scroller.scrollLeft === 0) {
      scroller.scrollLeft = scroller.scrollWidth / 2;
    }
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const timer = window.setInterval(() => {
      const scroller = scrollerRef.current;
      if (!scroller) return;
      scroller.scrollLeft += 1;
      normalizeScroll();
    }, 24);

    return () => window.clearInterval(timer);
  }, [isPaused]);

  useEffect(() => {
    return () => {
      if (touchResumeTimerRef.current) window.clearTimeout(touchResumeTimerRef.current);
    };
  }, []);

  return (
    <section className="space-y-3">
      <h5 className="text-lg font-bold tracking-normal text-slate-700 md:text-md">Elige tu marca favorita</h5>

      <div
        ref={scrollerRef}
        className={`brand-logo-scroll touch-auto overflow-x-scroll rounded-lg border border-slate-200 bg-white py-3 shadow-sm ${isDragging ? "is-dragging" : ""}`}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => !pointerDownRef.current && setIsPaused(false)}
        onTouchStart={pauseForTouch}
        onTouchEnd={resumeAfterTouch}
        onTouchCancel={resumeAfterTouch}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
      >
        <div className="flex w-max gap-3 px-3">
          {carouselBrands.map((brand, index) => {
            const logoFailed = failedLogos[brand.slug];

            return (
              <Link
                key={`${brand.slug}-${index}`}
                href={`/tienda?marca=${brand.slug}`}
                draggable={false}
                onDragStart={(event) => event.preventDefault()}
                onClick={preventClickAfterDrag}
                className="flex h-24 w-48 flex-none select-none items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-3 transition hover:border-[#098d8f] hover:shadow-md"
                aria-label={`Ver productos ${brand.name}`}
              >
                {!logoFailed ? (
                  <img
                    src={brand.logo}
                    alt={brand.name}
                    width="192"
                    height="96"
                    draggable={false}
                    className="block max-h-full w-full -translate-y-0.5 select-none object-contain object-center"
                    onError={() => markLogoAsFailed(brand.slug)}
                  />
                ) : (
                  <span className="text-center text-base font-bold uppercase tracking-normal text-slate-600">{brand.name}</span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
