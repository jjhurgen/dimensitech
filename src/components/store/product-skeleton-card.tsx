export function ProductSkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="aspect-square rounded-2xl bg-slate-200" />
      <div className="mt-4 h-3 w-1/3 rounded bg-slate-200" />
      <div className="mt-2 h-4 w-5/6 rounded bg-slate-200" />
      <div className="mt-2 h-4 w-1/2 rounded bg-slate-200" />
      <div className="mt-4 h-11 rounded-xl bg-slate-200" />
    </div>
  );
}
