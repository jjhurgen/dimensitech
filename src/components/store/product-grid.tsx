import { EmptyProductsState } from "@/components/store/empty-products-state";
import { ProductCard } from "@/components/store/product-card";
import { StoreProduct } from "@/lib/storefront";

export function ProductGrid({ products, compact = false }: { products: StoreProduct[]; compact?: boolean }) {
  if (!products.length) return <EmptyProductsState />;
  return (
    <div className={compact ? "grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" : "grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-4"}>
      {products.map((product) => <ProductCard key={product.id} product={product} compact={compact} />)}
    </div>
  );
}
