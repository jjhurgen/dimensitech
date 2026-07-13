import Link from "next/link";
import { colorSwatchStyle } from "@/lib/product-colors";

export type ColorVariantLink = {
  id: number;
  slug: string;
  color: string | null;
  price: number;
  stock: number;
  isRequestOnly: boolean;
};

export function ColorVariantLinks({
  variants,
  currentId,
  size = "sm"
}: {
  variants: ColorVariantLink[];
  currentId: number;
  size?: "sm" | "md";
}) {
  if (variants.length <= 1) return null;
  const dotSize = size === "md" ? "h-6 w-6" : "h-4 w-4";
  const ringSize = size === "md" ? "h-8 w-8" : "h-6 w-6";

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {variants.map((variant) => {
        const active = variant.id === currentId;
        const unavailable = variant.stock <= 0 && !variant.isRequestOnly;
        const label = `${variant.color ?? "Color"}${unavailable ? " sin stock" : ""}`;

        return (
          <Link
            key={variant.id}
            href={`/tienda/producto/${variant.slug}`}
            title={label}
            aria-label={`Ver color ${label}`}
            className={`grid ${ringSize} place-items-center rounded-full border transition hover:border-[#098d8f] ${active ? "border-[#098d8f] bg-[#098d8f]/10" : "border-slate-200 bg-white"} ${unavailable ? "opacity-45" : ""}`}
          >
            <span className={`${dotSize} rounded-full border`} style={colorSwatchStyle(variant.color)} />
          </Link>
        );
      })}
    </div>
  );
}
