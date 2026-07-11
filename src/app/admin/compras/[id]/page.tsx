import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { money } from "@/lib/utils";

export default async function PurchaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const purchase = await prisma.purchase.findUnique({
    where: { id: Number(id) },
    include: {
      provider: true,
      user: true,
      items: {
        include: {
          productSku: { include: { productType: true } },
          phoneUnits: true
        },
        orderBy: { id: "asc" }
      }
    }
  });
  if (!purchase) notFound();

  const subtotal = purchase.items.reduce((sum, item) => sum + Number(item.totalPrice), 0);
  const units = purchase.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalWithFreight = subtotal + Number(purchase.freightAmount);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/compras" className="text-sm font-bold text-[#098d8f] hover:text-[#003f48]">Volver a compras</Link>
          <h1 className="mt-1 text-2xl font-black text-slate-950">Compra {purchase.purchaseCode}</h1>
          <p className="text-sm text-slate-500">Detalle completo de productos comprados, costos e IMEIs registrados.</p>
        </div>
        <Badge value={purchase.status} />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <p className="text-xs font-black uppercase text-slate-500">Proveedor</p>
          <p className="mt-2 font-bold text-slate-950">{purchase.provider.name}</p>
          <p className="text-xs text-slate-500">{purchase.provider.dniRuc ?? ""}</p>
        </Card>
        <Card>
          <p className="text-xs font-black uppercase text-slate-500">Fecha</p>
          <p className="mt-2 font-bold text-slate-950">{purchase.purchaseDate.toLocaleDateString("es-PE")}</p>
          <p className="text-xs text-slate-500">Registrado por {purchase.user.name}</p>
        </Card>
        <Card>
          <p className="text-xs font-black uppercase text-slate-500">Unidades</p>
          <p className="mt-2 text-2xl font-black text-slate-950">{units}</p>
          <p className="text-xs text-slate-500">{purchase.items.length} item(s)</p>
        </Card>
        <Card>
          <p className="text-xs font-black uppercase text-slate-500">Total estimado</p>
          <p className="mt-2 text-2xl font-black text-slate-950">{money(totalWithFreight)}</p>
          <p className="text-xs text-slate-500">Incluye flete {money(purchase.freightAmount)}</p>
        </Card>
      </div>

      {purchase.notes ? (
        <Card>
          <p className="text-xs font-black uppercase text-slate-500">Notas</p>
          <p className="mt-2 text-sm text-slate-700">{purchase.notes}</p>
        </Card>
      ) : null}

      <Card className="overflow-hidden p-0">
        <div className="border-b border-slate-100 p-4">
          <h2 className="text-lg font-black text-slate-950">Productos comprados</h2>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Tipo</th>
              <th>Cantidad</th>
              <th>Costo unit.</th>
              <th>Flete unit.</th>
              <th>Total</th>
              <th>Unidades / IMEI</th>
            </tr>
          </thead>
          <tbody>
            {purchase.items.map((item) => (
              <tr key={item.id}>
                <td>
                  <p className="font-bold text-slate-950">{item.productSku.brand} {item.productSku.name}</p>
                  <p className="text-xs text-slate-500">{item.productSku.skuCode} | {item.productSku.storage} {item.productSku.color}</p>
                </td>
                <td>{item.productType}</td>
                <td>{item.quantity}</td>
                <td>{money(item.unitPurchasePrice)}</td>
                <td>{money(item.allocatedFreight ?? 0)}</td>
                <td>{money(item.totalPrice)}</td>
                <td>
                  {item.phoneUnits.length ? (
                    <div className="space-y-2">
                      {item.phoneUnits.map((unit) => (
                        <div key={unit.id} className="rounded-md border border-slate-200 bg-slate-50 p-2 text-xs">
                          <p><span className="font-black">IMEI 1:</span> {unit.imei1}</p>
                          {unit.imei2 ? <p><span className="font-black">IMEI 2:</span> {unit.imei2}</p> : null}
                          {unit.serialNumber ? <p><span className="font-black">Serie:</span> {unit.serialNumber}</p> : null}
                          <p><span className="font-black">Lista blanca:</span> {unit.whiteListRegistered ? "Si" : "No"}</p>
                          <p><span className="font-black">Estado:</span> <Badge value={unit.status} /></p>
                        </div>
                      ))}
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
