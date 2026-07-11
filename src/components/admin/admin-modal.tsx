"use client";

import { ReactNode, useState } from "react";
import { Pencil, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminModal({
  title,
  description,
  triggerLabel,
  triggerVariant = "primary",
  triggerIcon = "plus",
  children,
  className
}: {
  title: string;
  description?: string;
  triggerLabel: string;
  triggerVariant?: "primary" | "secondary";
  triggerIcon?: "plus" | "edit";
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const TriggerIcon = triggerIcon === "edit" ? Pencil : Plus;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold shadow-sm transition hover:shadow-md focus:outline-none focus:ring-4 focus:ring-blue-100",
          triggerVariant === "primary"
            ? "bg-blue-700 text-white hover:bg-blue-800"
            : "border border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        )}
      >
        <TriggerIcon className="h-4 w-4" />
        {triggerLabel}
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-stretch bg-slate-950/60 p-0 backdrop-blur-sm sm:place-items-center sm:p-4">
          <div className={cn("flex max-h-dvh w-full flex-col overflow-hidden bg-white shadow-2xl shadow-slate-950/30 sm:max-h-[94vh] sm:max-w-4xl sm:rounded-2xl", className)}>
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 bg-white p-4 sm:gap-4 sm:p-5">
              <div className="min-w-0">
                <h2 className="text-lg font-black tracking-tight text-slate-950 sm:text-xl">{title}</h2>
                {description ? <p className="mt-1 text-sm font-medium text-slate-500">{description}</p> : null}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-3 pb-8 sm:p-5 sm:pb-8">{children}</div>
          </div>
        </div>
      ) : null}
    </>
  );
}
