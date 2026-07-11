import { createDiscountCampaignAction, toggleDiscountCampaignAction, updateDiscountCampaignAction } from "./actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { defaultDiscountBadgeColor, discountBadgeClass, discountBadgeColors } from "@/lib/discount-badge-colors";
import { prisma } from "@/lib/prisma";
import { money } from "@/lib/utils";

function campaignStatus(startsAt: Date, endsAt: Date, isActive: boolean) {
  const now = new Date();
  if (!isActive) return "INACTIVE";
  if (startsAt > now) return "PENDING";
  if (endsAt < now) return "EXPIRED";
  return "ACTIVE";
}

function discountText(type: string, value: number) {
  if (type === "FIXED_AMOUNT") return `${money(value)} menos`;
  if (type === "PERCENTAGE") return `${value}% menos`;
  return `Precio final ${money(value)}`;
}

function dateTimeValue(date: Date) {
  return date.toISOString().slice(0, 16);
}

export default async function DiscountsPage() {
  const [products, campaigns] = await Promise.all([
    prisma.productSku.findMany({ include: { productType: true }, orderBy: [{ productType: { name: "asc" } }, { brand: "asc" }, { name: "asc" }] }),
    prisma.discountCampaign.findMany({ include: { products: { include: { productSku: true } } }, orderBy: { id: "desc" } })
  ]);

  return (
    <div className="space-y-6">
      <Card>
        <h1 className="text-xl font-black text-slate-950">Descuentos y campanas</h1>
        <p className="mt-1 text-sm text-slate-500">Programa promociones por fechas. El precio vuelve automaticamente al normal cuando termina la campana.</p>

        <form action={createDiscountCampaignAction} className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <Input name="name" placeholder="Nombre de campana, ej. Cyber Wow Julio" required />
            <Input name="badgeLabel" placeholder="Badge visible, ej. Cyber, Oferta, -10%" required />
            <BadgeColorPicker name="badgeColor" defaultValue={defaultDiscountBadgeColor} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Select name="discountType" required>
                <option value="FIXED_AMOUNT">Monto fijo menos</option>
                <option value="PERCENTAGE">Porcentaje</option>
                <option value="FINAL_PRICE">Precio final</option>
              </Select>
              <Input name="value" type="number" min="0" step="0.01" placeholder="Valor" required />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-500">Inicio</label>
                <Input name="startsAt" type="datetime-local" required />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-500">Fin</label>
                <Input name="endsAt" type="datetime-local" required />
              </div>
            </div>
            <Button>Crear campana</Button>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <h2 className="mb-2 text-sm font-black text-slate-900">Productos incluidos</h2>
            <div className="max-h-80 space-y-1 overflow-y-auto">
              {products.map((product) => (
                <label key={product.id} className="flex items-start gap-2 rounded-md bg-white p-2 text-sm hover:bg-[#098d8f]/5">
                  <input type="checkbox" name="productSkuIds" value={product.id} className="mt-1" />
                  <span>
                    <span className="font-bold text-slate-900">{product.brand} {product.name}</span>
                    <span className="block text-xs text-slate-500">{product.productType.name} | {product.storage} {product.color} | Precio normal {money(product.suggestedSalePrice)}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        </form>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-slate-100 p-4">
          <h2 className="text-lg font-black">Campanas creadas</h2>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Campana</th>
              <th>Badge</th>
              <th>Descuento</th>
              <th>Fechas</th>
              <th>Productos</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((campaign) => {
              const status = campaignStatus(campaign.startsAt, campaign.endsAt, campaign.isActive);
              const selectedIds = new Set(campaign.products.map((item) => item.productSkuId));
              const currentValue = campaign.products[0] ? Number(campaign.products[0].value) : 0;

              return (
                <tr key={campaign.id}>
                  <td className="font-bold text-slate-950">{campaign.name}</td>
                  <td><span className={discountBadgeClass(campaign.badgeColor)}>{campaign.badgeLabel}</span></td>
                  <td>{campaign.products[0] ? discountText(campaign.discountType, Number(campaign.products[0].value)) : "-"}</td>
                  <td>{campaign.startsAt.toLocaleString("es-PE")}<br />{campaign.endsAt.toLocaleString("es-PE")}</td>
                  <td>{campaign.products.map((item) => `${item.productSku.brand} ${item.productSku.name}`).join(", ")}</td>
                  <td><Badge value={status} /></td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      <form action={toggleDiscountCampaignAction}>
                        <input type="hidden" name="campaignId" value={campaign.id} />
                        <input type="hidden" name="isActive" value={String(!campaign.isActive)} />
                        <Button className={campaign.isActive ? "bg-slate-700 hover:bg-slate-800" : ""}>{campaign.isActive ? "Desactivar" : "Activar"}</Button>
                      </form>
                      <details className="w-full">
                        <summary className="cursor-pointer rounded-md border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">Editar</summary>
                        <form action={updateDiscountCampaignAction} className="mt-3 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                          <input type="hidden" name="campaignId" value={campaign.id} />
                          <Input name="name" defaultValue={campaign.name} required />
                          <Input name="badgeLabel" defaultValue={campaign.badgeLabel} required />
                          <BadgeColorPicker name="badgeColor" defaultValue={campaign.badgeColor || defaultDiscountBadgeColor} compact />
                          <div className="grid gap-2 sm:grid-cols-2">
                            <Select name="discountType" defaultValue={campaign.discountType}>
                              <option value="FIXED_AMOUNT">Monto fijo menos</option>
                              <option value="PERCENTAGE">Porcentaje</option>
                              <option value="FINAL_PRICE">Precio final</option>
                            </Select>
                            <Input name="value" type="number" min="0" step="0.01" defaultValue={currentValue} required />
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2">
                            <Input name="startsAt" type="datetime-local" defaultValue={dateTimeValue(campaign.startsAt)} required />
                            <Input name="endsAt" type="datetime-local" defaultValue={dateTimeValue(campaign.endsAt)} required />
                          </div>
                          <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border border-slate-200 bg-white p-2">
                            {products.map((product) => (
                              <label key={product.id} className="flex items-start gap-2 rounded-md p-2 text-sm hover:bg-[#098d8f]/5">
                                <input type="checkbox" name="productSkuIds" value={product.id} defaultChecked={selectedIds.has(product.id)} className="mt-1" />
                                <span>
                                  <span className="font-bold text-slate-900">{product.brand} {product.name}</span>
                                  <span className="block text-xs text-slate-500">{product.storage} {product.color} | {money(product.suggestedSalePrice)}</span>
                                </span>
                              </label>
                            ))}
                          </div>
                          <Button>Guardar cambios</Button>
                        </form>
                      </details>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function BadgeColorPicker({ name, defaultValue, compact = false }: { name: string; defaultValue: string; compact?: boolean }) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold text-slate-500">Color del badge</p>
      <div className={`grid gap-2 ${compact ? "sm:grid-cols-4" : "sm:grid-cols-2"}`}>
        {discountBadgeColors.map((color) => (
          <label key={color.value} className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:border-[#098d8f]/40 hover:bg-[#098d8f]/5">
            <input name={name} value={color.value} type="radio" defaultChecked={defaultValue === color.value} className="sr-only peer" />
            <span className={`h-5 w-5 rounded-full border border-slate-200 shadow-sm ${color.swatch}`} />
            <span className="flex-1">{color.label}</span>
            <span className="hidden rounded-full bg-[#098d8f]/10 px-2 py-0.5 text-[10px] font-black text-[#003f48] peer-checked:inline-flex">Activo</span>
          </label>
        ))}
      </div>
    </div>
  );
}
