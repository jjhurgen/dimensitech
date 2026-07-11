import { AdminModal } from "@/components/admin/admin-modal";
import Link from "next/link";
import { PurchaseForm } from "./purchase-form";
import { Pager } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { money, pageParams } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { activeBrands } from "@/lib/brands";

export default async function PurchasesPage({ searchParams }: { searchParams?: Promise<Record<string, string>> }) {
  const params = await searchParams;
  const { page, take, skip } = pageParams(params);
  const today = new Date().toISOString().slice(0, 10);
  const [providers, products, types, brands, images, rows, total] = await Promise.all([
    prisma.provider.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } }),
    prisma.productSku.findMany({
      where: { status: "ACTIVE" },
      include: { productType: true },
      orderBy: [{ brand: "asc" }, { name: "asc" }]
    }),
    prisma.productType.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } }),
    activeBrands(),
    prisma.productImageLibrary.findMany({ where: { isActive: true }, take: 30, orderBy: { updatedAt: "desc" } }),
    prisma.purchase.findMany({ include: { provider: true, user: true, items: true }, skip, take, orderBy: { id: "desc" } }),
    prisma.purchase.count()
  ]);
  const providerOptions = providers.map((provider) => ({ id: provider.id, name: provider.name }));
  const productOptions = products.map((product) => ({
    id: product.id,
    skuCode: product.skuCode,
    brand: product.brand,
    name: product.name,
    color: product.color,
    storage: product.storage,
    ram: product.ram,
    platform: product.platform,
    modelNumber: product.modelNumber,
    productType: {
      name: product.productType.name,
      requiresImei: product.productType.requiresImei
    }
  }));
  const typeOptions = types.map((type) => ({ id: type.id, name: type.name, requiresImei: type.requiresImei }));
  const brandOptions = brands.map((brand) => ({ id: brand.id, name: brand.name }));
  const imageOptions = images.map((image) => ({ id: image.id, productName: image.productName, brand: image.brand, color: image.color }));
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden p-0">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-bold">Compras</h1>
          <AdminModal title="Registrar compra" triggerLabel="Registrar compra" description="Registra ingreso de stock, costo unitario, flete e identificadores por unidad.">
            <PurchaseForm providers={providerOptions} products={productOptions} types={typeOptions} brands={brandOptions} images={imageOptions} today={today} />
          </AdminModal>
        </div>
        <table className="admin-table">
          <thead><tr><th>Codigo</th><th>Fecha</th><th>Proveedor</th><th>Items</th><th>Total compra</th><th>Flete</th><th>Estado</th><th>Usuario</th><th>Ver</th></tr></thead>
          <tbody>{rows.map((row) => {
            const totalItems = row.items.reduce((sum, item) => sum + item.quantity, 0);
            const totalPurchase = row.items.reduce((sum, item) => sum + Number(item.totalPrice), 0);
            return (
              <tr key={row.id}>
                <td className="font-bold text-slate-950">{row.purchaseCode}</td>
                <td>{row.purchaseDate.toLocaleDateString("es-PE")}</td>
                <td>{row.provider.name}</td>
                <td>{totalItems}</td>
                <td>{money(totalPurchase)}</td>
                <td>{money(row.freightAmount)}</td>
                <td><Badge value={row.status} /></td>
                <td>{row.user.name}</td>
                <td><Link href={`/admin/compras/${row.id}`} className="inline-flex h-9 items-center rounded-md border border-slate-200 px-3 text-sm font-bold text-slate-700 hover:bg-slate-50">Ver</Link></td>
              </tr>
            );
          })}</tbody>
        </table>
        <Pager page={page} total={total} basePath="/admin/compras" />
      </Card>
    </div>
  );
}
