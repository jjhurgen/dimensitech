import Link from "next/link";
import { storeCategories, storeHref } from "@/components/store/store-categories";

export function StoreCategoryBar({ basePath = "/tienda" }: { basePath?: string }) {
  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3">
        {storeCategories.map(({ icon: Icon, label, href }) => (
          <Link key={label} href={storeHref(href, basePath)} className="inline-flex min-w-fit items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:border-[#098d8f] hover:text-[#098d8f]">
            <Icon className="h-4 w-4 text-slate-500" />
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
