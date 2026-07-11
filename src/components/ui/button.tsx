import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#098d8f] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#003f48] hover:shadow-md focus:outline-none focus:ring-4 focus:ring-[#098d8f]/20 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}
