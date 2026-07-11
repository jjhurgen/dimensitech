import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

function pageHref(searchParams: Record<string, string>, page: number, basePath: string) {
  const params = new URLSearchParams(searchParams);
  if (page <= 1) {
    params.delete("page");
  } else {
    params.set("page", String(page));
  }

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

function visiblePages(currentPage: number, totalPages: number) {
  const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  const end = Math.min(totalPages, start + 4);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export function StorePagination({
  currentPage,
  totalPages,
  searchParams,
  basePath = "/tienda"
}: {
  currentPage: number;
  totalPages: number;
  searchParams: Record<string, string>;
  basePath?: string;
}) {
  if (totalPages <= 1) return null;

  const pages = visiblePages(currentPage, totalPages);
  const previousPage = Math.max(1, currentPage - 1);
  const nextPage = Math.min(totalPages, currentPage + 1);

  return (
    <nav className="mt-5 flex flex-wrap items-center justify-center gap-2" aria-label="Paginacion de productos">
      <Link
        href={pageHref(searchParams, previousPage, basePath)}
        aria-disabled={currentPage === 1}
        className={`inline-flex h-10 items-center gap-1 rounded-md border px-3 text-sm font-bold transition ${
          currentPage === 1
            ? "pointer-events-none border-slate-200 bg-slate-50 text-slate-400"
            : "border-slate-200 bg-white text-slate-700 hover:border-[#098d8f] hover:text-[#098d8f]"
        }`}
      >
        <ChevronLeft className="h-4 w-4" />
        Anterior
      </Link>

      {pages.map((page) => (
        <Link
          key={page}
          href={pageHref(searchParams, page, basePath)}
          aria-current={page === currentPage ? "page" : undefined}
          className={`grid h-10 w-10 place-items-center rounded-md border text-sm font-bold transition ${
            page === currentPage
              ? "border-[#098d8f] bg-[#098d8f] text-white"
              : "border-slate-200 bg-white text-slate-700 hover:border-[#098d8f] hover:text-[#098d8f]"
          }`}
        >
          {page}
        </Link>
      ))}

      <Link
        href={pageHref(searchParams, nextPage, basePath)}
        aria-disabled={currentPage === totalPages}
        className={`inline-flex h-10 items-center gap-1 rounded-md border px-3 text-sm font-bold transition ${
          currentPage === totalPages
            ? "pointer-events-none border-slate-200 bg-slate-50 text-slate-400"
            : "border-slate-200 bg-white text-slate-700 hover:border-[#098d8f] hover:text-[#098d8f]"
        }`}
      >
        Siguiente
        <ChevronRight className="h-4 w-4" />
      </Link>
    </nav>
  );
}
