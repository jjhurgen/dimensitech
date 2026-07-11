import { Card } from "@/components/ui/card";
import { money } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export default async function ReportsPage() {
  const [sales, gifts, phonesSold, freight] = await Promise.all([
    prisma.sale.findMany({ include: { customer: true }, orderBy: { saleDate: "desc" }, take: 15 }),
    prisma.saleItem.findMany({ where: { isGift: true }, include: { productSku: true, sale: true }, take: 15 }),
    prisma.saleItem.findMany({ where: { itemType: "PHONE" }, include: { phoneUnit: true, productSku: true, sale: true }, take: 15 }),
    prisma.purchase.aggregate({ _sum: { freightAmount: true } })
  ]);
  return (
    <div className="space-y-6">
      <Card><h1 className="text-xl font-bold">Reportes basicos</h1><p className="text-sm text-slate-500">Exportables: compras, ventas, inventario, IMEI vendidos, regalos, utilidad, stock bajo, reservas y flete. La tabla puede copiarse a Excel/PDF desde el navegador.</p></Card>
      <Card><h2 className="mb-3 font-bold">Ventas por fecha</h2>{sales.map((s) => <p key={s.id} className="border-t py-2 text-sm">{s.saleDate.toLocaleDateString("es-PE")} - {s.saleCode} - {s.customer.firstNames} - {money(s.total)} - utilidad {money(s.netProfitEstimated)}</p>)}</Card>
      <Card><h2 className="mb-3 font-bold">Accesorios regalados</h2>{gifts.map((g) => <p key={g.id} className="border-t py-2 text-sm">{g.sale.saleCode} - {g.productSku.name} - costo {money(g.totalCost)}</p>)}</Card>
      <Card><h2 className="mb-3 font-bold">Celulares vendidos por IMEI</h2>{phonesSold.map((p) => <p key={p.id} className="border-t py-2 text-sm">{p.sale.saleCode} - {p.productSku.name} - IMEI {p.phoneUnit?.imei1} - utilidad {money(p.profit)}</p>)}</Card>
      <Card><h2 className="font-bold">Gastos por flete</h2><p className="mt-2 text-2xl">{money(freight._sum.freightAmount)}</p></Card>
    </div>
  );
}
