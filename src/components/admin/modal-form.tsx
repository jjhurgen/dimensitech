import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ModalFormGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid gap-4 md:grid-cols-2", className)}>{children}</div>;
}

export function ModalSection({
  title,
  description,
  children
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="mb-4">
        <h3 className="text-sm font-black text-slate-950">{title}</h3>
        {description ? <p className="mt-1 text-xs font-medium leading-5 text-slate-500">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function Field({
  label,
  hint,
  children,
  className
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</span>
      {children}
      {hint ? <span className="block text-xs font-medium leading-5 text-slate-500">{hint}</span> : null}
    </label>
  );
}

export function CheckboxField({ children }: { children: ReactNode }) {
  return (
    <label className="flex min-h-11 items-center gap-3 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-bold text-slate-700 shadow-sm">
      {children}
    </label>
  );
}

export function ModalActions({ children }: { children: ReactNode }) {
  return (
    <div className="mt-4 flex flex-col gap-2 border-t border-slate-200 bg-slate-50 pt-4 sm:flex-row sm:justify-end [&>button]:w-full sm:[&>button]:w-auto">
      {children}
    </div>
  );
}
