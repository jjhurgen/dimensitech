import { AdminModal } from "@/components/admin/admin-modal";
import Link from "next/link";
import { SaleForm } from "./sale-form";
import { Pager } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { money, pageParams } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export default async function SalesPage({ searchParams }: { searchParams?: Promise<Record<string, string>> }) {
  const params = await searchParams;
  const { page, take, skip } = pageParams(params);
  const today = new Date().toISOString().slice(0, 10);
  const [customers, products, rows, total] = await Promise.all([
    prisma.customer.findMany({ orderBy: { firstNames: "asc" }, take: 100 }),
    prisma.productSku.findMany({
      where: { status: "ACTIVE" },
      include: { productType: true },
      orderBy: [{ brand: "asc" }, { name: "asc" }]
    }),
    prisma.sale.findMany({ include: { customer: true, user: true, items: true }, skip, take, orderBy: { id: "desc" } }),
    prisma.sale.count()
  ]);
  const customerOptions = customers.map((customer) => ({
    id: customer.id,
    dni: customer.dni,
    firstNames: customer.firstNames,
    lastNames: customer.lastNames
  }));
  const productOptions = products.map((product) => ({
    id: product.id,
    skuCode: product.skuCode,
    brand: product.brand,
    name: product.name,
    color: product.color,
    storage: product.storage,
    suggestedSalePrice: Number(product.suggestedSalePrice),
    productType: {
      name: product.productType.name,
      requiresImei: product.productType.requiresImei
    }
  }));
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden p-0">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-bold">Ventas</h1>
          <AdminModal title="Registrar venta" triggerLabel="Registrar venta" description="Confirma una venta de celular o accesorio y descuenta stock automaticamente.">
            <SaleForm customers={customerOptions} products={productOptions} today={today} />
          </AdminModal>
        </div>
        <table className="admin-table">
          <thead><tr><th>Codigo</th><th>Fecha</th><th>Cliente</th><th>Items</th><th>Total</th><th>Utilidad</th><th>Estado</th><th>Ver</th></tr></thead>
          <tbody>{rows.map((row) => {
            const totalItems = row.items.reduce((sum, item) => sum + item.quantity, 0);
            return (
              <tr key={row.id}>
                <td className="font-bold text-slate-950">{row.saleCode}</td>
                <td>{row.saleDate.toLocaleDateString("es-PE")}</td>
                <td>{row.customer.firstNames} {row.customer.lastNames}</td>
                <td>{totalItems}</td>
                <td>{money(row.total)}</td>
                <td>{money(row.netProfitEstimated)}</td>
                <td><Badge value={row.status} /></td>
                <td><Link href={`/admin/ventas/${row.id}`} className="inline-flex h-9 items-center rounded-md border border-slate-200 px-3 text-sm font-bold text-slate-700 hover:bg-slate-50">Ver</Link></td>
              </tr>
            );
          })}</tbody>
        </table>
        <Pager page={page} total={total} basePath="/admin/ventas" />
      </Card>
    </div>
  );
}
