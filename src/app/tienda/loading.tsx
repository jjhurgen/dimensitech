import { ProductSkeletonCard } from "@/components/store/product-skeleton-card";

export default function Loading() {
  return (
    <main className="min-h-screen bg-[#F5F7FB] p-4">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 h-36 animate-pulse rounded-2xl bg-white shadow-sm" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => <ProductSkeletonCard key={index} />)}
        </div>
      </div>
    </main>
  );
}
