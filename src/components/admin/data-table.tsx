import Link from "next/link";

function pageHref(basePath: string, searchParams: Record<string, string>, page: number) {
  const params = new URLSearchParams(searchParams);
  params.set("page", String(page));
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function Pager({
  page,
  total,
  basePath,
  searchParams = {}
}: {
  page: number;
  total: number;
  basePath: string;
  searchParams?: Record<string, string>;
}) {
  const pages = Math.max(Math.ceil(total / 15), 1);
  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <span className="font-medium text-slate-600">Pagina {page} de {pages}</span>
      <div className="grid grid-cols-2 gap-2 sm:flex">
        <Link className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 font-bold text-slate-700 hover:bg-slate-50" href={pageHref(basePath, searchParams, Math.max(page - 1, 1))}>Anterior</Link>
        <Link className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 font-bold text-slate-700 hover:bg-slate-50" href={pageHref(basePath, searchParams, Math.min(page + 1, pages))}>Siguiente</Link>
      </div>
    </div>
  );
}
