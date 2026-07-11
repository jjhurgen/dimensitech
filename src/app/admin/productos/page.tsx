import { AdminModal } from "@/components/admin/admin-modal";
import { ProductSkuForm } from "./product-sku-form";
import { Pager } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { money, pageParams } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { activeBrands } from "@/lib/brands";
import { productConditionLabel } from "@/lib/product-condition";

export default async function ProductsPage({ searchParams }: { searchParams?: Promise<Record<string, string>> }) {
  const params = await searchParams;
  const { page, q, take, skip } = pageParams(params);
  const [types, images, brands, rows, total] = await Promise.all([
    prisma.productType.findMany({ orderBy: { name: "asc" } }),
    prisma.productImageLibrary.findMany({ where: { isActive: true }, take: 30, orderBy: { updatedAt: "desc" } }),
    activeBrands(),
    prisma.productSku.findMany({
      where: q ? { OR: [{ name: { contains: q } }, { skuCode: { contains: q } }, { brand: { contains: q } }, { commercialModel: { contains: q } }] } : {},
      include: { productType: true, image: true },
      skip,
      take,
      orderBy: { id: "desc" }
    }),
    prisma.productSku.count({ where: q ? { OR: [{ name: { contains: q } }, { skuCode: { contains: q } }] } : {} })
  ]);
  const typeOptions = types.map((type) => ({ id: type.id, name: type.name, requiresImei: type.requiresImei }));
  const imageOptions = images.map((image) => ({ id: image.id, productName: image.productName, brand: image.brand, color: image.color }));
  const brandOptions = brands.map((brand) => ({ id: brand.id, name: brand.name }));
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden p-0">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-bold">Catalogo</h2>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <form className="w-full sm:w-64"><Input name="q" placeholder="Buscar producto" defaultValue={q} /></form>
            <AdminModal title="Producto / SKU" triggerLabel="Nuevo SKU" description="Crea un SKU para inventario, compras, ventas y catalogo web.">
              <ProductSkuForm types={typeOptions} images={imageOptions} brands={brandOptions} />
            </AdminModal>
          </div>
        </div>
        <table className="admin-table">
          <thead><tr><th>SKU</th><th>Producto</th><th>Tipo</th><th>Condicion</th><th>Precio</th><th>Tienda</th><th>Pedido</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>{rows.map((row) => {
            const product = {
              id: row.id,
              skuCode: row.skuCode,
              productTypeId: row.productTypeId,
              imageId: row.imageId,
              brand: row.brand,
              name: row.name,
              commercialModel: row.commercialModel,
              platform: row.platform,
              color: row.color,
              storage: row.storage,
              ram: row.ram,
              condition: row.condition,
              modelNumber: row.modelNumber,
              shortDescription: row.shortDescription,
              suggestedSalePrice: Number(row.suggestedSalePrice),
              visibleInStore: row.visibleInStore,
              availableOnRequest: row.availableOnRequest,
              requestDeliveryDays: row.requestDeliveryDays,
              status: row.status
            };
            return <tr key={row.id}><td>{row.skuCode}</td><td className="font-medium">{row.brand} {row.name} {row.color} {row.storage}</td><td>{row.productType.name}</td><td>{productConditionLabel(row.condition)}</td><td>{money(row.suggestedSalePrice)}</td><td><Badge value={row.visibleInStore ? "PENDING" : "CANCELLED"}>{row.visibleInStore ? "Visible" : "Oculto"}</Badge></td><td>{row.availableOnRequest ? <Badge value="PENDING">{row.requestDeliveryDays ? `${row.requestDeliveryDays} dia(s)` : "A pedido"}</Badge> : <span className="text-xs font-semibold text-slate-400">No</span>}</td><td><Badge value={row.status} /></td><td><AdminModal title="Editar SKU" triggerLabel="Editar" triggerVariant="secondary" triggerIcon="edit" description="Corrige datos del producto, precio, visibilidad o imagen asignada."><ProductSkuForm types={typeOptions} images={imageOptions} brands={brandOptions} product={product} /></AdminModal></td></tr>;
          })}</tbody>
        </table>
        <Pager page={page} total={total} basePath="/admin/productos" />
      </Card>
    </div>
  );
}
