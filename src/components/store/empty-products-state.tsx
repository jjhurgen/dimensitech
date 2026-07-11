import { SearchX } from "lucide-react";

export function EmptyProductsState() {
  return (
    <div className="grid min-h-80 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
      <div>
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100">
          <SearchX className="h-7 w-7 text-slate-400" />
        </div>
        <h2 className="mt-3 text-lg font-bold">No encontramos productos con esos filtros.</h2>
        <p className="mt-1 text-sm text-slate-500">Prueba con otra marca, categoria o rango de precio.</p>
      </div>
    </div>
  );
}
