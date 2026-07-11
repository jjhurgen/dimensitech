"use client";

import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StoreFilters } from "@/lib/storefront";
import { StoreFiltersPanel } from "@/components/store/store-filters";

export function StoreMobileFiltersDrawer({ filters }: { filters: StoreFilters }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" className="h-10 rounded-md bg-[#003f48] lg:hidden" onClick={() => setOpen(true)}>
        <SlidersHorizontal className="h-4 w-4" />
        Filtrar
      </Button>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-slate-950/50" onClick={() => setOpen(false)} aria-label="Cerrar filtros" />
          <aside className="absolute inset-y-0 left-0 w-[88vw] max-w-sm overflow-y-auto bg-white p-4 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-black">Filtros</h2>
              <button onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-md bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <StoreFiltersPanel filters={filters} compact />
          </aside>
        </div>
      ) : null}
    </>
  );
}
