import { ArrowUpRight, Boxes, CreditCard, Gift, PackageCheck, ShoppingBag, Truck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { money } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [sales, purchases, phonesAvailable, phonesReserved, lowAccessories, reservations, gifts] = await Promise.all([
    prisma.sale.aggregate({ _sum: { total: true, grossProfit: true, netProfitEstimated: true }, _count: true }),
    prisma.purchase.aggregate({ _sum: { freightAmount: true }, _count: true }),
    prisma.phoneUnit.count({ where: { status: "AVAILABLE" } }),
    prisma.phoneUnit.count({ where: { status: "RESERVED" } }),
    prisma.productSku.count({ where: { reservationItems: { some: { status: "PENDING" } } } }),
    prisma.reservation.count({ where: { status: "PENDING" } }),
    prisma.saleItem.aggregate({ where: { isGift: true }, _sum: { totalCost: true }, _count: true })
  ]);

  const cards = [
    [CreditCard, "Total vendido", money(sales._sum.total), "Ventas confirmadas"],
    [ArrowUpRight, "Utilidad bruta", money(sales._sum.grossProfit), "Sin aislar flete"],
    [ArrowUpRight, "Utilidad con flete", money(sales._sum.netProfitEstimated), "Estimacion neta"],
    [Truck, "Flete compras", money(purchases._sum.freightAmount), "Gasto acumulado"],
    [PackageCheck, "Celulares disponibles", phonesAvailable, "Stock fisico"],
    [Boxes, "Celulares reservados", phonesReserved, "No visible en tienda"],
    [ShoppingBag, "Reservas pendientes", reservations, "Web y WhatsApp"],
    [Gift, "Regalos", money(gifts._sum.totalCost), `${gifts._count} accesorios`],
    [Boxes, "Alertas stock", lowAccessories, "Productos a revisar"]
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-950">Dashboard</h1>
        <p className="mt-1 text-sm font-medium text-slate-500">Resumen operativo para compras, ventas, inventario y reservas.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map(([Icon, title, value, detail]) => (
          <Card key={title} className="relative overflow-hidden">
            <div className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700">
              <Icon className="h-5 w-5" />
            </div>
            <p className="pr-12 text-sm font-bold text-slate-500">{title}</p>
            <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">{value}</p>
            <p className="mt-2 text-xs font-medium text-slate-500">{detail}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
