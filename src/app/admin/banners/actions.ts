"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveBannerImageUpload } from "@/lib/uploads";

function parseDate(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function createPromotionBannerAction(formData: FormData) {
  const user = await requireUser();
  const title = String(formData.get("title") ?? "").trim();
  const productSkuId = Number(formData.get("productSkuId"));
  const rawCampaignId = Number(formData.get("campaignId"));
  const campaignId = rawCampaignId || null;
  const sortOrder = Number(formData.get("sortOrder") ?? 0);
  const file = formData.get("bannerFile");

  if (!title) throw new Error("Ingrese un titulo para el banner");
  if (!productSkuId) throw new Error("Seleccione el producto destino del banner");
  if (!file || typeof file === "string" || file.size === 0) throw new Error("Seleccione una imagen para el banner");

  const [product, campaign] = await Promise.all([
    prisma.productSku.findUnique({ where: { id: productSkuId } }),
    campaignId ? prisma.discountCampaign.findUnique({ where: { id: campaignId } }) : Promise.resolve(null)
  ]);

  if (!product) throw new Error("El producto destino no existe");
  if (campaignId && !campaign) throw new Error("La campana asociada no existe");

  const startsAt = parseDate(formData.get("startsAt")) ?? campaign?.startsAt ?? null;
  const endsAt = parseDate(formData.get("endsAt")) ?? campaign?.endsAt ?? null;
  if (!startsAt || !endsAt || startsAt >= endsAt) throw new Error("Ingrese un rango de fechas valido para el banner");

  const imageUrl = await saveBannerImageUpload(file);
  if (!imageUrl) throw new Error("No se pudo guardar la imagen del banner");

  await prisma.promotionBanner.create({
    data: {
      title,
      productSkuId,
      campaignId,
      startsAt,
      endsAt,
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
      imageUrl,
      createdById: user.id
    }
  });

  revalidatePath("/admin/banners");
  revalidatePath("/tienda");
  redirect("/admin/banners");
}

export async function togglePromotionBannerAction(formData: FormData) {
  await requireUser();
  const id = Number(formData.get("bannerId"));
  const isActive = String(formData.get("isActive")) === "true";
  if (!id) throw new Error("Banner invalido");

  await prisma.promotionBanner.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin/banners");
  revalidatePath("/tienda");
  redirect("/admin/banners");
}

export async function deletePromotionBannerAction(formData: FormData) {
  const user = await requireUser();
  const id = Number(formData.get("bannerId"));
  if (!id) throw new Error("Banner invalido");

  await prisma.promotionBanner.update({
    where: { id },
    data: {
      isActive: false,
      deletedAt: new Date(),
      deletedById: user.id
    }
  });

  revalidatePath("/admin/banners");
  revalidatePath("/tienda");
  redirect("/admin/banners");
}
