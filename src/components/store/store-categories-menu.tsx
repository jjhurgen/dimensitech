"use client";

import Link from "next/link";
import { ChevronDown, Menu } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { storeCategories, storeHref } from "@/components/store/store-categories";

export function StoreCategoriesMenu({ basePath = "/tienda" }: { basePath?: string }) {
  const [isActive, setIsActive] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateActiveState = () => {
      const active = window.scrollY > 56;
      setIsActive(active);
      if (!active) setIsOpen(false);
    };

    updateActiveState();
    window.addEventListener("scroll", updateActiveState, { passive: true });
    return () => window.removeEventListener("scroll", updateActiveState);
  }, []);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return (
    <div ref={menuRef} className="relative block">
      <button
        type="button"
        disabled={!isActive}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={() => setIsOpen((open) => !open)}
        className={`inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-bold transition lg:px-4 ${
          isActive
            ? "border-[#098d8f] bg-white text-[#003f48] shadow-sm hover:bg-slate-50"
            : "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
        }`}
      >
        <Menu className="h-4 w-4 sm:hidden" />
        <span className="hidden sm:inline">Categorias</span>
        <ChevronDown className={`hidden h-4 w-4 transition sm:block ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen ? (
        <div className="absolute left-0 top-12 z-50 w-56 overflow-hidden rounded-md border border-slate-200 bg-white shadow-xl shadow-slate-900/10 sm:w-64" role="menu">
          {storeCategories.map(({ icon: Icon, label, href }) => (
            <Link
              key={label}
              href={storeHref(href, basePath)}
              role="menuitem"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 text-sm font-bold text-slate-700 last:border-b-0 hover:bg-slate-50 hover:text-[#098d8f]"
            >
              <Icon className="h-4 w-4 text-slate-500" />
              {label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
