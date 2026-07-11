import type { Metadata } from "next";
import { ActiveFilterChips } from "@/components/store/active-filter-chips";
import { BrandCarousel } from "@/components/store/brand-carousel";
import { ClearFiltersOnReload } from "@/components/store/clear-filters-on-reload";
import { FeaturedProductsCarousel } from "@/components/store/featured-products-carousel";
import { ProductGrid } from "@/components/store/product-grid";
import { ProductSortSelect } from "@/components/store/product-sort-select";
import { StorePagination } from "@/components/store/store-pagination";
import { StoreBreadcrumb } from "@/components/store/store-breadcrumb";
import { StoreCategoryBar } from "@/components/store/store-category-bar";
import { StoreFiltersPanel } from "@/components/store/store-filters";
import { StoreHeader } from "@/components/store/store-header";
import { StoreMobileFiltersDrawer } from "@/components/store/store-mobile-filters-drawer";
import { SlidersHorizontal } from "lucide-react";
import { StoreFilters, getFeaturedStoreProducts, getStoreProducts, productSlug, titleForFilters } from "@/lib/storefront";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "DimensiTech | Celulares y accesorios",
  description: "Compra celulares iPhone, Android y accesorios tecnologicos en DIMENSITECH STORE. Consulta stock, precios y arma tu carrito."
};

const PRODUCTS_PER_PAGE = 8;

export async function StorefrontPage({
  searchParams,
  basePath = "/tienda"
}: {
  searchParams?: Promise<Record<string, string>>;
  basePath?: string;
}) {
  const currentSearchParams = (await searchParams) ?? {};
  const filters = { ...currentSearchParams } as StoreFilters;
  if (!filters.search && (filters as any).q) filters.search = (filters as any).q;
  const requestedPage = Number(currentSearchParams.page ?? 1);
  const products = await getStoreProducts(filters);
  const totalPages = Math.max(1, Math.ceil(products.length / PRODUCTS_PER_PAGE));
  const currentPage = Number.isFinite(requestedPage) ? Math.min(Math.max(1, requestedPage), totalPages) : 1;
  const pageStart = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const paginatedProducts = products.slice(pageStart, pageStart + PRODUCTS_PER_PAGE);
  const visibleFrom = products.length ? pageStart + 1 : 0;
  const visibleTo = Math.min(pageStart + PRODUCTS_PER_PAGE, products.length);
  const featured = await getFeaturedStoreProducts(products);
  const now = new Date();
  const banners = await prisma.promotionBanner.findMany({
    where: { isActive: true, deletedAt: null, startsAt: { lte: now }, endsAt: { gte: now } },
    include: { productSku: true },
    orderBy: [{ sortOrder: "asc" }, { id: "desc" }],
    take: 8
  });
  const title = titleForFilters(filters);

  return (
    <main className="min-h-screen bg-[#f6f7f9] text-slate-950">
      <ClearFiltersOnReload basePath={basePath} />
      <StoreHeader search={filters.search} basePath={basePath} />
      <StoreCategoryBar basePath={basePath} />

      <div className="mx-auto max-w-7xl space-y-4 px-4 py-4">
        <FeaturedProductsCarousel
          products={featured}
          banners={banners.map((banner) => ({
            id: banner.id,
            title: banner.title,
            imageUrl: banner.imageUrl,
            href: `/tienda/producto/${productSlug({
              id: banner.productSku.id,
              brand: banner.productSku.brand,
              name: banner.productSku.name,
              color: banner.productSku.color,
              storage: banner.productSku.storage
            })}`
          }))}
        />

        <BrandCarousel basePath={basePath} />

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-4 p-4 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              {/* <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">{title}</h1> */}
              <p className="mt-1 text-sm font-medium text-slate-500">
                {products.length ? `Mostrando ${visibleFrom}-${visibleTo} de ${products.length} productos` : "0 productos"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StoreMobileFiltersDrawer filters={filters} basePath={basePath} />
              <p className="font-medium text-sm text-slate-500">Ordenar por:</p>
              <ProductSortSelect basePath={basePath} />
            </div>
          </div>
          <div className="border-t border-slate-100 px-4 py-3">
            <ActiveFilterChips filters={filters} basePath={basePath} />
          </div>
        </section>

        <StoreBreadcrumb current={title} basePath={basePath} />

        <div className="grid gap-4 lg:grid-cols-[272px_1fr]">
          <aside className="hidden self-start rounded-lg border border-slate-200 bg-white shadow-sm lg:block">
            <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
              <SlidersHorizontal className="h-4 w-4 text-slate-500" />
              <h2 className="text-sm font-black uppercase text-slate-800">Filtros</h2>
            </div>
            <div className="p-4">
              <StoreFiltersPanel filters={filters} basePath={basePath} />
            </div>
          </aside>

          <section>
            <ProductGrid products={paginatedProducts} />
            <StorePagination currentPage={currentPage} totalPages={totalPages} searchParams={currentSearchParams} basePath={basePath} />
          </section>
        </div>
      </div>
    </main>
  );
}

export default async function StorePage({ searchParams }: { searchParams?: Promise<Record<string, string>> }) {
  return <StorefrontPage searchParams={searchParams} />;
}
