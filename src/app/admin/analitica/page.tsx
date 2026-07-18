import Link from "next/link";
import { Activity, Eye, MousePointerClick, ShoppingCart, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

type RangeKey = "7d" | "30d" | "90d";

type CountRow = {
  count: bigint;
};

type VisitsRow = {
  pageViews: bigint;
  uniqueVisitors: bigint;
};

type ProductMetricRow = {
  productSkuId: number;
  productName: string;
  views: bigint;
  clicks: bigint;
  carts: bigint;
};

type PageMetricRow = {
  path: string;
  views: bigint;
  visitors: bigint;
};

type DailyMetricRow = {
  day: Date | string;
  pageViews: bigint;
  visitors: bigint;
};

type ActiveSessionRow = {
  currentPath: string | null;
  productSkuId: number | null;
  productName: string | null;
  secondsAgo: bigint;
};

type ReferrerRow = {
  referrer: string | null;
  visits: bigint;
};

const ranges: Array<{ key: RangeKey; label: string; days: number }> = [
  { key: "7d", label: "7 dias", days: 7 },
  { key: "30d", label: "30 dias", days: 30 },
  { key: "90d", label: "90 dias", days: 90 }
];

function rangeStart(range: RangeKey) {
  const days = ranges.find((item) => item.key === range)?.days ?? 30;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function int(value: bigint | number | null | undefined) {
  return Number(value ?? 0);
}

function percent(part: number, total: number) {
  if (!total) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}

function formatNumber(value: bigint | number | null | undefined) {
  return new Intl.NumberFormat("es-PE").format(int(value));
}

function formatDay(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short" }).format(date);
}

function referrerLabel(value: string | null) {
  if (!value) return "Directo / sin referencia";
  try {
    const url = new URL(value);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return value.slice(0, 70);
  }
}

export default async function AnalyticsPage({ searchParams }: { searchParams?: Promise<Record<string, string>> }) {
  const params = await searchParams;
  const requestedRange = params?.r as RangeKey | undefined;
  const range = ranges.some((item) => item.key === requestedRange) ? requestedRange! : "30d";
  const since = rangeStart(range);
  const activeSince = new Date(Date.now() - 5 * 60 * 1000);

  const [
    visitsRows,
    productViewsRows,
    productClicksRows,
    addToCartRows,
    activeRows,
    topProducts,
    topPages,
    dailyMetrics,
    activeSessions,
    referrers
  ] = await Promise.all([
    prisma.$queryRaw<VisitsRow[]>`
      SELECT
        COUNT(*) AS pageViews,
        COUNT(DISTINCT visitor_hash) AS uniqueVisitors
      FROM web_analytics_events
      WHERE event_type = 'page_view' AND created_at >= ${since}
    `,
    prisma.$queryRaw<CountRow[]>`
      SELECT COUNT(*) AS count
      FROM web_analytics_events
      WHERE event_type = 'product_view' AND created_at >= ${since}
    `,
    prisma.$queryRaw<CountRow[]>`
      SELECT COUNT(*) AS count
      FROM web_analytics_events
      WHERE event_type = 'product_click' AND created_at >= ${since}
    `,
    prisma.$queryRaw<CountRow[]>`
      SELECT COUNT(*) AS count
      FROM web_analytics_events
      WHERE event_type = 'add_to_cart' AND created_at >= ${since}
    `,
    prisma.$queryRaw<CountRow[]>`
      SELECT COUNT(*) AS count
      FROM web_analytics_sessions
      WHERE last_seen_at >= ${activeSince}
    `,
    prisma.$queryRaw<ProductMetricRow[]>`
      SELECT
        e.product_sku_id AS productSkuId,
        TRIM(CONCAT(p.marca, ' ', p.nombre, ' ', COALESCE(p.almacenamiento, ''), ' ', COALESCE(p.color, ''))) AS productName,
        COUNT(CASE WHEN e.event_type = 'product_view' THEN 1 END) AS views,
        COUNT(CASE WHEN e.event_type = 'product_click' THEN 1 END) AS clicks,
        COUNT(CASE WHEN e.event_type = 'add_to_cart' THEN 1 END) AS carts
      FROM web_analytics_events e
      LEFT JOIN product_skus p ON p.id = e.product_sku_id
      WHERE e.created_at >= ${since}
        AND e.product_sku_id IS NOT NULL
        AND e.event_type IN ('product_view', 'product_click', 'add_to_cart')
      GROUP BY e.product_sku_id, p.marca, p.nombre, p.almacenamiento, p.color
      ORDER BY views DESC, clicks DESC, carts DESC
      LIMIT 10
    `,
    prisma.$queryRaw<PageMetricRow[]>`
      SELECT
        path,
        COUNT(*) AS views,
        COUNT(DISTINCT visitor_hash) AS visitors
      FROM web_analytics_events
      WHERE event_type = 'page_view' AND created_at >= ${since}
      GROUP BY path
      ORDER BY views DESC
      LIMIT 10
    `,
    prisma.$queryRaw<DailyMetricRow[]>`
      SELECT
        DATE(created_at) AS day,
        COUNT(*) AS pageViews,
        COUNT(DISTINCT visitor_hash) AS visitors
      FROM web_analytics_events
      WHERE event_type = 'page_view' AND created_at >= ${since}
      GROUP BY DATE(created_at)
      ORDER BY day ASC
    `,
    prisma.$queryRaw<ActiveSessionRow[]>`
      SELECT
        s.current_path AS currentPath,
        s.current_product_sku_id AS productSkuId,
        TRIM(CONCAT(p.marca, ' ', p.nombre, ' ', COALESCE(p.almacenamiento, ''), ' ', COALESCE(p.color, ''))) AS productName,
        TIMESTAMPDIFF(SECOND, s.last_seen_at, NOW(3)) AS secondsAgo
      FROM web_analytics_sessions s
      LEFT JOIN product_skus p ON p.id = s.current_product_sku_id
      WHERE s.last_seen_at >= ${activeSince}
      ORDER BY s.last_seen_at DESC
      LIMIT 12
    `,
    prisma.$queryRaw<ReferrerRow[]>`
      SELECT referrer, COUNT(*) AS visits
      FROM web_analytics_events
      WHERE event_type = 'page_view' AND created_at >= ${since}
      GROUP BY referrer
      ORDER BY visits DESC
      LIMIT 8
    `
  ]);

  const visits = visitsRows[0];
  const pageViews = int(visits?.pageViews);
  const uniqueVisitors = int(visits?.uniqueVisitors);
  const productViews = int(productViewsRows[0]?.count);
  const productClicks = int(productClicksRows[0]?.count);
  const addToCart = int(addToCartRows[0]?.count);
  const activeNow = int(activeRows[0]?.count);

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-950">Analitica web</h1>
            <p className="text-sm text-slate-500">Trafico, productos vistos y actividad reciente del sitio.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {ranges.map((item) => (
              <Link
                key={item.key}
                href={`/admin/analitica?r=${item.key}`}
                className={`rounded-lg border px-3 py-2 text-sm font-bold ${range === item.key ? "border-[#098d8f] bg-[#098d8f] text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard icon={<Eye className="h-5 w-5" />} label="Visitas" value={formatNumber(pageViews)} />
        <MetricCard icon={<Users className="h-5 w-5" />} label="Visitantes unicos" value={formatNumber(uniqueVisitors)} />
        <MetricCard icon={<Eye className="h-5 w-5" />} label="Vistas de producto" value={formatNumber(productViews)} />
        <MetricCard icon={<MousePointerClick className="h-5 w-5" />} label="Clicks en productos" value={formatNumber(productClicks)} helper={`CTR ${percent(productClicks, pageViews)}`} />
        <MetricCard icon={<ShoppingCart className="h-5 w-5" />} label="Anadidos al carrito" value={formatNumber(addToCart)} helper={`${percent(addToCart, productViews)} de vistas`} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden p-0">
          <SectionHeader title="Productos con mas interes" description="Ordenado por vistas, clicks y carritos." />
          <table className="admin-table">
            <thead><tr><th>Producto</th><th>Vistas</th><th>Clicks</th><th>Carritos</th></tr></thead>
            <tbody>
              {topProducts.map((row) => (
                <tr key={row.productSkuId}>
                  <td className="font-bold text-slate-950">{row.productName || `Producto ${row.productSkuId}`}</td>
                  <td>{formatNumber(row.views)}</td>
                  <td>{formatNumber(row.clicks)}</td>
                  <td>{formatNumber(row.carts)}</td>
                </tr>
              ))}
              {!topProducts.length ? <EmptyRow columns={4} /> : null}
            </tbody>
          </table>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-50 text-emerald-700"><Activity className="h-5 w-5" /></span>
            <div>
              <p className="text-sm font-black uppercase text-slate-500">Activos ahora</p>
              <p className="text-3xl font-black text-slate-950">{formatNumber(activeNow)}</p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {activeSessions.map((session, index) => (
              <div key={`${session.currentPath}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="truncate text-sm font-bold text-slate-900">{session.productName || session.currentPath || "Visitando la web"}</p>
                <p className="mt-1 truncate text-xs font-medium text-slate-500">{session.currentPath ?? "/"} · hace {formatNumber(session.secondsAgo)}s</p>
              </div>
            ))}
            {!activeSessions.length ? <p className="text-sm font-medium text-slate-500">Sin visitantes activos en los ultimos 5 minutos.</p> : null}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="overflow-hidden p-0">
          <SectionHeader title="Paginas mas visitadas" description="Rutas con mas visitas." />
          <table className="admin-table">
            <thead><tr><th>Pagina</th><th>Visitas</th><th>Unicos</th></tr></thead>
            <tbody>
              {topPages.map((row) => (
                <tr key={row.path}>
                  <td className="max-w-64 truncate font-bold text-slate-950">{row.path}</td>
                  <td>{formatNumber(row.views)}</td>
                  <td>{formatNumber(row.visitors)}</td>
                </tr>
              ))}
              {!topPages.length ? <EmptyRow columns={3} /> : null}
            </tbody>
          </table>
        </Card>

        <Card className="overflow-hidden p-0">
          <SectionHeader title="Trafico por dia" description="Visitas y visitantes unicos." />
          <table className="admin-table">
            <thead><tr><th>Dia</th><th>Visitas</th><th>Unicos</th></tr></thead>
            <tbody>
              {dailyMetrics.map((row) => (
                <tr key={String(row.day)}>
                  <td className="font-bold text-slate-950">{formatDay(row.day)}</td>
                  <td>{formatNumber(row.pageViews)}</td>
                  <td>{formatNumber(row.visitors)}</td>
                </tr>
              ))}
              {!dailyMetrics.length ? <EmptyRow columns={3} /> : null}
            </tbody>
          </table>
        </Card>

        <Card className="overflow-hidden p-0">
          <SectionHeader title="Referencias" description="Desde donde llegaron." />
          <table className="admin-table">
            <thead><tr><th>Origen</th><th>Visitas</th></tr></thead>
            <tbody>
              {referrers.map((row, index) => (
                <tr key={`${row.referrer}-${index}`}>
                  <td className="max-w-64 truncate font-bold text-slate-950">{referrerLabel(row.referrer)}</td>
                  <td>{formatNumber(row.visits)}</td>
                </tr>
              ))}
              {!referrers.length ? <EmptyRow columns={2} /> : null}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, helper }: { icon: React.ReactNode; label: string; value: string; helper?: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">{value}</p>
          {helper ? <p className="mt-1 text-xs font-bold text-[#098d8f]">{helper}</p> : null}
        </div>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#098d8f]/10 text-[#098d8f]">{icon}</span>
      </div>
    </Card>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="border-b border-slate-100 p-4">
      <h2 className="font-black text-slate-950">{title}</h2>
      <p className="text-sm text-slate-500">{description}</p>
    </div>
  );
}

function EmptyRow({ columns }: { columns: number }) {
  return (
    <tr>
      <td colSpan={columns} className="text-center text-sm font-medium text-slate-500">Todavia no hay datos para este periodo.</td>
    </tr>
  );
}
