import { cn } from "@/lib/utils";

export const discountBadgeColors = [
  { value: "TEAL", label: "Verde marca", swatch: "bg-[#098d8f]", className: "bg-[#098d8f] text-white ring-[#098d8f]/30" },
  { value: "NAVY", label: "Azul oscuro", swatch: "bg-[#003f48]", className: "bg-[#003f48] text-white ring-[#003f48]/30" },
  { value: "WHITE", label: "Blanco", swatch: "bg-white", className: "bg-white text-[#003f48] ring-[#098d8f]/30" },
  { value: "EMERALD", label: "Verde stock", swatch: "bg-emerald-600", className: "bg-emerald-600 text-white ring-emerald-200" },
  { value: "AMBER", label: "Amarillo oferta", swatch: "bg-amber-400", className: "bg-amber-400 text-slate-950 ring-amber-200" },
  { value: "RED", label: "Rojo promo", swatch: "bg-red-600", className: "bg-red-600 text-white ring-red-200" },
  { value: "BLUE", label: "Azul campaña", swatch: "bg-blue-600", className: "bg-blue-600 text-white ring-blue-200" },
  { value: "SLATE", label: "Negro elegante", swatch: "bg-slate-900", className: "bg-slate-900 text-white ring-slate-300" }
] as const;

export type DiscountBadgeColor = (typeof discountBadgeColors)[number]["value"];

export const defaultDiscountBadgeColor: DiscountBadgeColor = "TEAL";

export function isDiscountBadgeColor(value: string): value is DiscountBadgeColor {
  return discountBadgeColors.some((color) => color.value === value);
}

export function discountBadgeClass(value?: string | null, extra?: string) {
  const option = discountBadgeColors.find((color) => color.value === value) ?? discountBadgeColors[0];
  return cn("inline-flex rounded px-2 py-1 text-xs font-black uppercase shadow-sm ring-1", option.className, extra);
}
