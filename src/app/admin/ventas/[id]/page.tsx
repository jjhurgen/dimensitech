import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { money } from "@/lib/utils";

export default async function SaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sale = await prisma.sale.findUnique({
    where: { id: Number(id) },
    include: {
      customer: true,
      user: true,
      items: {
        include: {
          productSku: { include: { productType: true } },
          phoneUnit: true
        },
        orderBy: { id: "asc" }
      }
    }
  });
  if (!sale) notFound();

  const units = sale.items.reduce((sum, item) => sum + item.quantity, 0);
  const customerName = `${sale.customer.firstNames} ${sale.customer.lastNames}`.trim();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/ventas" className="text-sm font-bold text-[#098d8f] hover:text-[#003f48]">Volver a ventas</Link>
          <h1 className="mt-1 text-2xl font-black text-slate-950">Venta {sale.saleCode}</h1>
          <p className="text-sm text-slate-500">Detalle completo de productos vendidos, costos, descuentos y utilidad.</p>
        </div>
        <Badge value={sale.status} />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <p className="text-xs font-black uppercase text-slate-500">Cliente</p>
          <p className="mt-2 font-bold text-slate-950">{customerName || "Cliente"}</p>
          <p className="text-xs text-slate-500">{sale.customer.documentType} {sale.customer.dni ?? ""}</p>
        </Card>
        <Card>
          <p className="text-xs font-black uppercase text-slate-500">Fecha y canal</p>
          <p className="mt-2 font-bold text-slate-950">{sale.saleDate.toLocaleDateString("es-PE")}</p>
          <p className="text-xs text-slate-500">{sale.saleChannel} | {sale.paymentMethod}</p>
        </Card>
        <Card>
          <p className="text-xs font-black uppercase text-slate-500">Unidades</p>
          <p className="mt-2 text-2xl font-black text-slate-950">{units}</p>
          <p className="text-xs text-slate-500">{sale.items.length} item(s)</p>
        </Card>
        <Card>
          <p className="text-xs font-black uppercase text-slate-500">Total venta</p>
          <p className="mt-2 text-2xl font-black text-slate-950">{money(sale.total)}</p>
          <p className="text-xs text-slate-500">Registrado por {sale.user.name}</p>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <p className="text-xs font-black uppercase text-slate-500">Subtotal</p>
          <p className="mt-2 text-xl font-black text-slate-950">{money(sale.subtotal)}</p>
        </Card>
        <Card>
          <p className="text-xs font-black uppercase text-slate-500">Descuentos</p>
          <p className="mt-2 text-xl font-black text-slate-950">{money(sale.discountTotal)}</p>
        </Card>
        <Card>
          <p className="text-xs font-black uppercase text-slate-500">Costo regalos</p>
          <p className="mt-2 text-xl font-black text-slate-950">{money(sale.giftCostTotal)}</p>
        </Card>
        <Card>
          <p className="text-xs font-black uppercase text-slate-500">Utilidad neta estimada</p>
          <p className="mt-2 text-xl font-black text-slate-950">{money(sale.netProfitEstimated)}</p>
        </Card>
      </div>

      {sale.notes ? (
        <Card>
          <p className="text-xs font-black uppercase text-slate-500">Notas</p>
          <p className="mt-2 text-sm text-slate-700">{sale.notes}</p>
        </Card>
      ) : null}

      <Card className="overflow-hidden p-0">
        <div className="border-b border-slate-100 p-4">
          <h2 className="text-lg font-black text-slate-950">Productos vendidos</h2>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Tipo</th>
              <th>Cantidad</th>
              <th>Precio unit.</th>
              <th>Descuento</th>
              <th>Total venta</th>
              <th>Costo</th>
              <th>Utilidad</th>
              <th>Unidad / IMEI</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item) => (
              <tr key={item.id}>
                <td>
                  <p className="font-bold text-slate-950">{item.productSku.brand} {item.productSku.name}</p>
                  <p className="text-xs text-slate-500">{item.productSku.skuCode} | {item.productSku.storage} {item.productSku.color}</p>
                  {item.isGift ? <span className="mt-1 inline-flex rounded bg-amber-50 px-2 py-1 text-xs font-black text-amber-700">Regalo</span> : null}
                </td>
                <td>{item.itemType === "PHONE" ? "Celular" : "Accesorio"}</td>
                <td>{item.quantity}</td>
                <td>{money(item.unitSalePrice)}</td>
                <td>{money(item.discount)}</td>
                <td>{money(item.totalSalePrice)}</td>
                <td>{money(item.totalCost)}</td>
                <td>{money(item.profit)}</td>
                <td>
                  {item.phoneUnit ? (
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-2 text-xs">
                      <p><span className="font-black">IMEI 1:</span> {item.phoneUnit.imei1}</p>
                      {item.phoneUnit.imei2 ? <p><span className="font-black">IMEI 2:</span> {item.phoneUnit.imei2}</p> : null}
                      {item.phoneUnit.serialNumber ? <p><span className="font-black">Serie:</span> {item.phoneUnit.serialNumber}</p> : null}
                      <p><span className="font-black">Estado:</span> <Badge value={item.phoneUnit.status} /></p>
                    </div>
                  ) : (
                    <span className="text-sm text-slate-500">Control por cantidad</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
