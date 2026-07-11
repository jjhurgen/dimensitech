import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function money(value: number | string | { toString(): string } | null | undefined) {
  const amount = Number(value?.toString() ?? 0);
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN"
  }).format(amount);
}

export function pageParams(searchParams?: Record<string, string | string[] | undefined>) {
  const page = Math.max(Number(searchParams?.page ?? 1), 1);
  const q = String(searchParams?.q ?? "").trim();
  return { page, q, take: 15, skip: (page - 1) * 15 };
}
