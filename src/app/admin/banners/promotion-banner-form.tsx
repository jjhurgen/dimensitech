"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { createPromotionBannerAction, updatePromotionBannerAction } from "./actions";

type BannerProductOption = {
  id: number;
  brand: string;
  name: string;
  storage: string | null;
  color: string | null;
  productType: { name: string };
};

type BannerCampaignOption = {
  id: number;
  name: string;
};

export function PromotionBannerForm({
  products,
  campaigns,
  banner
}: {
  products: BannerProductOption[];
  campaigns: BannerCampaignOption[];
  banner?: {
    id: number;
    title: string;
    productSkuId: number | null;
    campaignId: number | null;
    sortOrder: number;
    startsAt: string;
    endsAt: string;
  };
}) {
  const [campaignId, setCampaignId] = useState(banner?.campaignId ? String(banner.campaignId) : "");
  const isEditing = Boolean(banner);
  const usesCampaign = Boolean(campaignId);

  return (
    <form action={isEditing ? updatePromotionBannerAction : createPromotionBannerAction} className="mt-5 grid gap-4 lg:grid-cols-2">
      {banner ? <input type="hidden" name="bannerId" value={banner.id} /> : null}
      <div className="space-y-3">
        <Input name="title" placeholder="Titulo interno del banner" defaultValue={banner?.title ?? ""} required />
        <Select name="campaignId" value={campaignId} onChange={(event) => setCampaignId(event.target.value)}>
          <option value="">Sin campana asociada</option>
          {campaigns.map((campaign) => (
            <option key={campaign.id} value={campaign.id}>
              {campaign.name}
            </option>
          ))}
        </Select>
        <Select name="productSkuId" required={!usesCampaign} disabled={usesCampaign} defaultValue={banner?.productSkuId ? String(banner.productSkuId) : ""}>
          <option value="">{usesCampaign ? "La campana sera el destino" : "Producto destino"}</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.productType.name} | {product.brand} {product.name} {product.storage ?? ""} {product.color ?? ""}
            </option>
          ))}
        </Select>
        <p className="text-xs font-semibold text-slate-500">
          Elige una campana para llevar al cliente a todos sus productos, o deja la campana vacia y elige un producto destino.
        </p>
        <Input name="sortOrder" type="number" defaultValue={banner?.sortOrder ?? 0} placeholder="Orden" />
      </div>

      <div className="space-y-3">
        <div className="rounded-lg border border-[#098d8f]/20 bg-[#098d8f]/5 p-3">
          <p className="text-sm font-black text-[#003f48]">Medida recomendada del banner</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
            Sube imagenes horizontales de <span className="font-black text-slate-900">1246 x 420 px</span> o proporcion similar <span className="font-black text-slate-900">3:1</span>. El banner se adapta completo en movil y escritorio, asi que evita textos demasiado pequenos. Formatos permitidos: JPG, PNG, WEBP o AVIF. Peso maximo: 10 MB.
          </p>
        </div>
        <Input name="bannerFile" type="file" accept="image/png,image/jpeg,image/webp,image/avif" required={!isEditing} />
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-500">Inicio</label>
            <Input name="startsAt" type="datetime-local" defaultValue={banner?.startsAt ?? ""} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-500">Fin</label>
            <Input name="endsAt" type="datetime-local" defaultValue={banner?.endsAt ?? ""} />
          </div>
        </div>
        <p className="text-xs font-semibold text-slate-500">{isEditing ? "Deja la imagen vacia para conservar la actual." : "Si eliges una campana y dejas las fechas vacias, se usaran las fechas de esa campana."}</p>
        <Button>{isEditing ? "Guardar banner" : "Crear banner"}</Button>
      </div>
    </form>
  );
}
