import Link from "next/link";
import { X } from "lucide-react";
import { StoreFilters, activeFilterChips } from "@/lib/storefront";

export function ActiveFilterChips({ filters }: { filters: StoreFilters }) {
  const chips = activeFilterChips(filters);
  if (!chips.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => {
        const params = new URLSearchParams(filters as Record<string, string>);
        params.delete(chip.key);
        return (
          <Link key={chip.key} href={`/tienda?${params.toString()}`} className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:border-[#098d8f] hover:text-[#098d8f]">
            {chip.label}
            <X className="h-3 w-3" />
          </Link>
        );
      })}
    </div>
  );
}
