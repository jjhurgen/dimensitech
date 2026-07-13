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
  const rawProductSkuId = Number(formData.get("productSkuId"));
  const productSkuId = rawProductSkuId || null;
  const rawCampaignId = Number(formData.get("campaignId"));
  const campaignId = rawCampaignId || null;
  const sortOrder = Number(formData.get("sortOrder") ?? 0);
  const file = formData.get("bannerFile");

  if (!title) throw new Error("Ingrese un titulo para el banner");
  if (!productSkuId && !campaignId) throw new Error("Seleccione un producto destino o una campana para el banner");
  if (!file || typeof file === "string" || file.size === 0) throw new Error("Seleccione una imagen para el banner");

  const [product, campaign] = await Promise.all([
    productSkuId ? prisma.productSku.findUnique({ where: { id: productSkuId } }) : Promise.resolve(null),
    campaignId ? prisma.discountCampaign.findUnique({ where: { id: campaignId } }) : Promise.resolve(null)
  ]);

  if (productSkuId && !product) throw new Error("El producto destino no existe");
  if (campaignId && !campaign) throw new Error("La campana asociada no existe");

  const startsAt = parseDate(formData.get("startsAt")) ?? campaign?.startsAt ?? null;
  const endsAt = parseDate(formData.get("endsAt")) ?? campaign?.endsAt ?? null;
  if (!startsAt || !endsAt || startsAt >= endsAt) throw new Error("Ingrese un rango de fechas valido para el banner");

  const imageUrl = await saveBannerImageUpload(file);
  if (!imageUrl) throw new Error("No se pudo guardar la imagen del banner");

  await prisma.promotionBanner.create({
    data: {
      title,
      productSkuId: campaignId ? null : productSkuId,
      campaignId,
      startsAt,
      endsAt,
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
      imageUrl,
      createdById: user.id
    }
  });

  revalidatePath("/admin/banners");
  revalidatePath("/admin/descuentos");
  revalidatePath("/tienda");
  revalidatePath("/");
  redirect("/admin/banners");
}

export async function updatePromotionBannerAction(formData: FormData) {
  await requireUser();
  const id = Number(formData.get("bannerId"));
  const title = String(formData.get("title") ?? "").trim();
  const rawProductSkuId = Number(formData.get("productSkuId"));
  const productSkuId = rawProductSkuId || null;
  const rawCampaignId = Number(formData.get("campaignId"));
  const campaignId = rawCampaignId || null;
  const sortOrder = Number(formData.get("sortOrder") ?? 0);
  const file = formData.get("bannerFile");

  if (!id) throw new Error("Banner invalido");
  if (!title) throw new Error("Ingrese un titulo para el banner");
  if (!productSkuId && !campaignId) throw new Error("Seleccione un producto destino o una campana para el banner");

  const [banner, product, campaign] = await Promise.all([
    prisma.promotionBanner.findFirst({ where: { id, deletedAt: null } }),
    productSkuId ? prisma.productSku.findUnique({ where: { id: productSkuId } }) : Promise.resolve(null),
    campaignId ? prisma.discountCampaign.findUnique({ where: { id: campaignId } }) : Promise.resolve(null)
  ]);

  if (!banner) throw new Error("El banner no existe");
  if (productSkuId && !product) throw new Error("El producto destino no existe");
  if (campaignId && !campaign) throw new Error("La campana asociada no existe");

  const startsAt = parseDate(formData.get("startsAt")) ?? campaign?.startsAt ?? null;
  const endsAt = parseDate(formData.get("endsAt")) ?? campaign?.endsAt ?? null;
  if (!startsAt || !endsAt || startsAt >= endsAt) throw new Error("Ingrese un rango de fechas valido para el banner");

  const hasNewImage = file && typeof file !== "string" && file.size > 0;
  const imageUrl = hasNewImage
    ? await saveBannerImageUpload(file)
    : null;
  if (hasNewImage && !imageUrl) throw new Error("No se pudo guardar la imagen del banner");

  await prisma.promotionBanner.update({
    where: { id },
    data: {
      title,
      productSkuId: campaignId ? null : productSkuId,
      campaignId,
      startsAt,
      endsAt,
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
      ...(imageUrl ? { imageUrl } : {})
    }
  });

  revalidatePath("/admin/banners");
  revalidatePath("/admin/descuentos");
  revalidatePath("/tienda");
  revalidatePath("/");
  redirect("/admin/banners");
}

export async function togglePromotionBannerAction(formData: FormData) {
  await requireUser();
  const id = Number(formData.get("bannerId"));
  const isActive = String(formData.get("isActive")) === "true";
  if (!id) throw new Error("Banner invalido");

  await prisma.promotionBanner.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin/banners");
  revalidatePath("/admin/descuentos");
  revalidatePath("/tienda");
  revalidatePath("/");
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
  revalidatePath("/admin/descuentos");
  revalidatePath("/tienda");
  revalidatePath("/");
  redirect("/admin/banners");
}
