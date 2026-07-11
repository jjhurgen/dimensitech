"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type ConfirmActionFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  hiddenFields: Record<string, string | number>;
  triggerLabel: string;
  title: string;
  message: string;
  confirmLabel: string;
  variant?: "primary" | "danger";
};

export function ConfirmActionForm({
  action,
  hiddenFields,
  triggerLabel,
  title,
  message,
  confirmLabel,
  variant = "primary"
}: ConfirmActionFormProps) {
  const [open, setOpen] = useState(false);
  const buttonClass = variant === "danger" ? "bg-slate-700 hover:bg-slate-800" : undefined;

  return (
    <>
      <Button type="button" className={buttonClass} onClick={() => setOpen(true)}>
        {triggerLabel}
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-2xl sm:p-5">
            <h2 className="text-lg font-black text-slate-950">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{message}</p>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setOpen(false)} className="h-10 rounded-md border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50">
                Volver
              </button>
              <form action={action}>
                {Object.entries(hiddenFields).map(([name, value]) => (
                  <input key={name} type="hidden" name={name} value={value} />
                ))}
                <Button className={buttonClass}>{confirmLabel}</Button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
