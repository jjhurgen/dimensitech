import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { money, pageParams } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { accessoryAverageCost, availableAccessoryStock, reservedAccessoryStock } from "@/lib/inventory";
import type { ReactNode } from "react";

export default async function InventoryPage({ searchParams }: { searchParams?: Promise<Record<string, string>> }) {
  const params = await searchParams;
  const { page, q, take, skip } = pageParams(params);
  const phoneWhere = q ? {
    OR: [
      { imei1: { contains: q } },
      { imei2: { contains: q } },
      { serialNumber: { contains: q } },
      { productSku: { name: { contains: q } } },
      { productSku: { brand: { contains: q } } }
    ]
  } : {};
  const accessoryWhere = {
    productType: { requiresImei: false },
    ...(q ? { OR: [{ name: { contains: q } }, { brand: { contains: q } }, { skuCode: { contains: q } }] } : {})
  };
  const [phones, phonesTotal, accessorySkus, accessoriesTotal] = await Promise.all([
    prisma.phoneUnit.findMany({ where: phoneWhere, include: { productSku: true, purchase: { include: { provider: true } } }, orderBy: { id: "desc" }, skip, take }),
    prisma.phoneUnit.count({ where: phoneWhere }),
    prisma.productSku.findMany({ where: accessoryWhere, include: { productType: true }, skip, take, orderBy: { id: "desc" } }),
    prisma.productSku.count({ where: accessoryWhere })
  ]);
  const accessories = await Promise.all(accessorySkus.map(async (sku) => ({
    sku,
    available: await availableAccessoryStock(sku.id),
    reserved: await reservedAccessoryStock(sku.id),
    averageCost: await accessoryAverageCost(sku.id)
  })));
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Inventario</h1>
          <p className="text-sm text-slate-500">Busca por IMEI, producto, marca, serie o SKU.</p>
        </div>
        <form><Input name="q" placeholder="Buscar inventario" defaultValue={q} /></form>
      </div>

      <InventoryAccordion id="phones" title="Inventario de celulares" summary={`${phonesTotal} unidades registradas`} defaultOpen>
        <div className="overflow-x-auto">
          <table className="admin-table min-w-[1100px]">
            <thead><tr><th>Estado</th><th>Producto</th><th>Plataforma</th><th>Color</th><th>Almacenamiento</th><th>RAM</th><th>IMEI 1</th><th>IMEI 2</th><th>Serie</th><th>Lista blanca</th><th>Compra</th><th>Proveedor</th><th>Costo base</th><th>Flete</th><th>Costo real</th><th>Precio sugerido</th><th>Ingreso</th></tr></thead>
            <tbody>{phones.map((unit) => <tr key={unit.id}><td><Badge value={unit.status} /></td><td>{unit.productSku.brand} {unit.productSku.name}</td><td>{unit.platform}</td><td>{unit.color}</td><td>{unit.storage}</td><td>{unit.ram}</td><td>{unit.imei1}</td><td>{unit.imei2}</td><td>{unit.serialNumber}</td><td>{unit.whiteListRegistered ? "Si" : "No"}</td><td>{unit.purchase.purchaseCode}</td><td>{unit.purchase.provider.name}</td><td>{money(unit.unitPurchasePrice)}</td><td>{money(unit.allocatedFreight)}</td><td>{money(Number(unit.unitPurchasePrice) + Number(unit.allocatedFreight ?? 0))}</td><td>{money(unit.productSku.suggestedSalePrice)}</td><td>{unit.createdAt.toLocaleDateString("es-PE")}</td></tr>)}</tbody>
          </table>
        </div>
        <InventoryPager page={page} total={phonesTotal} q={q} anchor="phones" />
      </InventoryAccordion>
      <InventoryAccordion id="accessories" title="Inventario de accesorios" summary={`${accessoriesTotal} productos registrados`}>
        <div className="overflow-x-auto">
          <table className="admin-table min-w-[1100px]">
            <thead><tr><th>Estado</th><th>Producto</th><th>Tipo</th><th>Color</th><th>Almacenamiento</th><th>RAM</th><th>Disponible</th><th>Reservado</th><th>Total</th><th>Costo base</th><th>Flete</th><th>Costo real</th><th>Precio sugerido</th><th>Stock minimo</th><th>Ingreso</th></tr></thead>
            <tbody>{accessories.map(({ sku, available, reserved, averageCost }) => {
              const minStock = sku.minStock ?? sku.productType.defaultMinStock;
              const isLowStock = available <= minStock;
              const status = available > 0 ? "AVAILABLE" : reserved > 0 ? "RESERVED" : "SOLD";
              return (
                <tr key={sku.id}>
                  <td><Badge value={status} /></td>
                  <td className="font-bold text-slate-950">{sku.brand} {sku.name}</td>
                  <td>{sku.productType.name}</td>
                  <td>{sku.color}</td>
                  <td>{sku.storage}</td>
                  <td>{sku.ram}</td>
                  <td>{available}</td>
                  <td>{reserved}</td>
                  <td>{available + reserved}</td>
                  <td>{money(averageCost)}</td>
                  <td>-</td>
                  <td>{money(averageCost)}</td>
                  <td>{money(sku.suggestedSalePrice)}</td>
                  <td>
                    <span className="font-semibold text-slate-900">{minStock}</span>
                    {isLowStock ? <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700">Bajo stock</span> : null}
                  </td>
                  <td>{sku.createdAt.toLocaleDateString("es-PE")}</td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
        <InventoryPager page={page} total={accessoriesTotal} q={q} anchor="accessories" />
      </InventoryAccordion>
    </div>
  );
}

function InventoryAccordion({
  id,
  title,
  summary,
  defaultOpen,
  children
}: {
  id: string;
  title: string;
  summary: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <Card id={id} className="overflow-hidden p-0">
      <input id={`inventory-${id}`} name="inventory-accordion" type="radio" className="peer sr-only" defaultChecked={defaultOpen} />
      <label htmlFor={`inventory-${id}`} className="flex cursor-pointer items-center justify-between gap-3 p-4 transition hover:bg-slate-50">
        <div>
          <h2 className="text-xl font-bold text-slate-950">{title}</h2>
          <p className="text-sm font-medium text-slate-500">{summary}</p>
        </div>
        <span className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-lg font-black text-slate-500 transition peer-checked:rotate-180">
          ^
        </span>
      </label>
      <div className="hidden border-t border-slate-200 peer-checked:block">
        {children}
      </div>
    </Card>
  );
}

function InventoryPager({ page, total, q, anchor }: { page: number; total: number; q?: string; anchor: string }) {
  const pages = Math.max(Math.ceil(total / 15), 1);
  const query = q ? `&q=${encodeURIComponent(q)}` : "";
  return (
    <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm">
      <span>Pagina {page} de {pages}</span>
      <div className="flex gap-2">
        <a className="rounded border px-3 py-1" href={`/admin/inventario?page=${Math.max(page - 1, 1)}${query}#${anchor}`}>Anterior</a>
        <a className="rounded border px-3 py-1" href={`/admin/inventario?page=${Math.min(page + 1, pages)}${query}#${anchor}`}>Siguiente</a>
      </div>
    </div>
  );
}
