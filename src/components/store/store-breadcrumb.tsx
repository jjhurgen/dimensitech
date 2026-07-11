import Link from "next/link";

export function StoreBreadcrumb({ current }: { current: string }) {
  return (
    <nav className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
      <Link href="/tienda" className="hover:text-[#098d8f]">Inicio</Link>
      <span>/</span>
      <span>Tecnologia</span>
      <span>/</span>
      <span className="font-medium text-slate-700">{current}</span>
    </nav>
  );
}
