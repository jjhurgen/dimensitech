import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmActionForm } from "@/components/admin/confirm-action-form";
import { prisma } from "@/lib/prisma";
import { deletePromotionBannerAction, togglePromotionBannerAction } from "./actions";
import { PromotionBannerForm } from "./promotion-banner-form";

function bannerStatus(startsAt: Date, endsAt: Date, isActive: boolean) {
  const now = new Date();
  if (!isActive) return "INACTIVE";
  if (startsAt > now) return "PENDING";
  if (endsAt < now) return "EXPIRED";
  return "ACTIVE";
}

function dateTimeValue(date: Date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

export default async function BannersPage() {
  const [products, campaigns, banners] = await Promise.all([
    prisma.productSku.findMany({
      select: {
        id: true,
        brand: true,
        name: true,
        storage: true,
        color: true,
        productType: { select: { name: true } }
      },
      orderBy: [{ productType: { name: "asc" } }, { brand: "asc" }, { name: "asc" }]
    }),
    prisma.discountCampaign.findMany({ select: { id: true, name: true }, orderBy: { id: "desc" } }),
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
        <p className="mt-1 text-sm text-slate-500">Administra los banners del slider principal de la tienda. Cada banner puede abrir un producto o una campana completa.</p>

        <PromotionBannerForm products={products} campaigns={campaigns} />
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
                  <td>{banner.campaign ? `Campana: ${banner.campaign.name}` : banner.productSku ? `${banner.productSku.brand} ${banner.productSku.name}` : "Sin destino"}</td>
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
                      <details className="w-full">
                        <summary className="cursor-pointer rounded-md border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">Editar</summary>
                        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                          <PromotionBannerForm
                            products={products}
                            campaigns={campaigns}
                            banner={{
                              id: banner.id,
                              title: banner.title,
                              productSkuId: banner.productSkuId,
                              campaignId: banner.campaignId,
                              sortOrder: banner.sortOrder,
                              startsAt: dateTimeValue(banner.startsAt),
                              endsAt: dateTimeValue(banner.endsAt)
                            }}
                          />
                        </div>
                      </details>
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
