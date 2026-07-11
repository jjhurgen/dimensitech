import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmActionForm } from "@/components/admin/confirm-action-form";
import { Input, Select } from "@/components/ui/input";
import { prisma } from "@/lib/prisma";
import { createPromotionBannerAction, deletePromotionBannerAction, togglePromotionBannerAction } from "./actions";

function bannerStatus(startsAt: Date, endsAt: Date, isActive: boolean) {
  const now = new Date();
  if (!isActive) return "INACTIVE";
  if (startsAt > now) return "PENDING";
  if (endsAt < now) return "EXPIRED";
  return "ACTIVE";
}

export default async function BannersPage() {
  const [products, campaigns, banners] = await Promise.all([
    prisma.productSku.findMany({ include: { productType: true }, orderBy: [{ productType: { name: "asc" } }, { brand: "asc" }, { name: "asc" }] }),
    prisma.discountCampaign.findMany({ orderBy: { id: "desc" } }),
    prisma.promotionBanner.findMany({
      where: { deletedAt: null },
      include: { productSku: true, campaign: true, createdBy: true, deletedBy: true },
      orderBy: [{ sortOrder: "asc" }, { id: "desc" }]
    })
  ]);

  return (
    <div className="space-y-6">
      <Card>
        <h1 className="text-xl font-black text-slate-950">Banners</h1>
        <p className="mt-1 text-sm text-slate-500">Administra los banners del slider principal de la tienda. Cada banner abre el detalle completo del producto elegido.</p>

        <form action={createPromotionBannerAction} className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <Input name="title" placeholder="Titulo interno del banner" required />
            <Select name="productSkuId" required>
              <option value="">Producto destino</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.productType.name} | {product.brand} {product.name} {product.storage ?? ""} {product.color ?? ""}
                </option>
              ))}
            </Select>
            <Select name="campaignId">
              <option value="">Sin campana asociada</option>
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </Select>
            <Input name="sortOrder" type="number" defaultValue={0} placeholder="Orden" />
          </div>

          <div className="space-y-3">
            <div className="rounded-lg border border-[#098d8f]/20 bg-[#098d8f]/5 p-3">
              <p className="text-sm font-black text-[#003f48]">Medida recomendada del banner</p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                Sube imagenes horizontales de <span className="font-black text-slate-900">1246 x 420 px</span> o proporcion similar <span className="font-black text-slate-900">3:1</span>. El banner se adapta completo en movil y escritorio, asi que evita textos demasiado pequenos. Formatos permitidos: JPG, PNG, WEBP o AVIF. Peso maximo: 10 MB.
              </p>
            </div>
            <Input name="bannerFile" type="file" accept="image/png,image/jpeg,image/webp,image/avif" required />
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-500">Inicio</label>
                <Input name="startsAt" type="datetime-local" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-500">Fin</label>
                <Input name="endsAt" type="datetime-local" />
              </div>
            </div>
            <p className="text-xs font-semibold text-slate-500">Si eliges una campana y dejas las fechas vacias, se usaran las fechas de esa campana.</p>
            <Button>Crear banner</Button>
          </div>
        </form>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-slate-100 p-4">
          <h2 className="text-lg font-black">Banners creados</h2>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Imagen</th>
              <th>Titulo</th>
              <th>Destino</th>
              <th>Campana</th>
              <th>Fechas</th>
              <th>Auditoria</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {banners.map((banner) => {
              const status = bannerStatus(banner.startsAt, banner.endsAt, banner.isActive);
              return (
                <tr key={banner.id}>
                  <td>
                    <div className="relative h-16 w-28 overflow-hidden rounded-md bg-slate-100">
                      <Image src={banner.imageUrl} alt={banner.title} fill sizes="112px" className="object-cover" />
                    </div>
                  </td>
                  <td className="font-bold text-slate-950">{banner.title}</td>
                  <td>{banner.productSku.brand} {banner.productSku.name}</td>
                  <td>{banner.campaign?.name ?? "-"}</td>
                  <td>{banner.startsAt.toLocaleString("es-PE")}<br />{banner.endsAt.toLocaleString("es-PE")}</td>
                  <td>
                    <p className="text-xs font-semibold text-slate-700">Subido por: {banner.createdBy?.name ?? "No registrado"}</p>
                    {banner.deletedBy ? <p className="text-xs text-slate-500">Eliminado por: {banner.deletedBy.name}</p> : null}
                  </td>
                  <td><Badge value={status} /></td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      <form action={togglePromotionBannerAction}>
                        <input type="hidden" name="bannerId" value={banner.id} />
                        <input type="hidden" name="isActive" value={String(!banner.isActive)} />
                        <Button className={banner.isActive ? "bg-slate-700 hover:bg-slate-800" : ""}>{banner.isActive ? "Desactivar" : "Activar"}</Button>
                      </form>
                      <ConfirmActionForm
                        action={deletePromotionBannerAction}
                        hiddenFields={{ bannerId: banner.id }}
                        triggerLabel="Eliminar"
                        title="Eliminar banner"
                        message={`Se eliminara el banner "${banner.title}" del slider web. Esta accion quedara registrada con tu usuario.`}
                        confirmLabel="Si, eliminar banner"
                        variant="danger"
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
            {banners.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-sm font-semibold text-slate-500">Todavia no hay banners creados.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
