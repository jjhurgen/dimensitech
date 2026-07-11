"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { DiscountType } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { defaultDiscountBadgeColor, isDiscountBadgeColor } from "@/lib/discount-badge-colors";
import { prisma } from "@/lib/prisma";

const discountTypes = new Set<DiscountType>(["FIXED_AMOUNT", "PERCENTAGE", "FINAL_PRICE"]);

export async function createDiscountCampaignAction(formData: FormData) {
  await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const badgeLabel = String(formData.get("badgeLabel") ?? "").trim();
  const rawBadgeColor = String(formData.get("badgeColor") ?? defaultDiscountBadgeColor);
  const badgeColor = isDiscountBadgeColor(rawBadgeColor) ? rawBadgeColor : defaultDiscountBadgeColor;
  const discountType = String(formData.get("discountType") ?? "") as DiscountType;
  const value = Number(formData.get("value"));
  const startsAt = new Date(String(formData.get("startsAt") ?? ""));
  const endsAt = new Date(String(formData.get("endsAt") ?? ""));
  const productIds = formData.getAll("productSkuIds").map(Number).filter(Boolean);

  if (!name || !badgeLabel || !discountTypes.has(discountType)) throw new Error("Datos de campaña incompletos");
  if (!Number.isFinite(value) || value <= 0) throw new Error("Valor de descuento invalido");
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || startsAt >= endsAt) throw new Error("Rango de fechas invalido");
  if (!productIds.length) throw new Error("Seleccione al menos un producto");

  await prisma.discountCampaign.create({
    data: {
      name,
      badgeLabel,
      badgeColor,
      discountType,
      startsAt,
      endsAt,
      products: {
        create: productIds.map((productSkuId) => ({ productSkuId, value }))
      }
    }
  });

  revalidatePath("/admin/descuentos");
  revalidatePath("/tienda");
  redirect("/admin/descuentos");
}

export async function toggleDiscountCampaignAction(formData: FormData) {
  await requireUser();
  const id = Number(formData.get("campaignId"));
  const isActive = String(formData.get("isActive")) === "true";
  await prisma.discountCampaign.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin/descuentos");
  revalidatePath("/tienda");
  redirect("/admin/descuentos");
}

export async function updateDiscountCampaignAction(formData: FormData) {
  await requireUser();
  const id = Number(formData.get("campaignId"));
  const name = String(formData.get("name") ?? "").trim();
  const badgeLabel = String(formData.get("badgeLabel") ?? "").trim();
  const rawBadgeColor = String(formData.get("badgeColor") ?? defaultDiscountBadgeColor);
  const badgeColor = isDiscountBadgeColor(rawBadgeColor) ? rawBadgeColor : defaultDiscountBadgeColor;
  const discountType = String(formData.get("discountType") ?? "") as DiscountType;
  const value = Number(formData.get("value"));
  const startsAt = new Date(String(formData.get("startsAt") ?? ""));
  const endsAt = new Date(String(formData.get("endsAt") ?? ""));
  const productIds = formData.getAll("productSkuIds").map(Number).filter(Boolean);

  if (!id || !name || !badgeLabel || !discountTypes.has(discountType)) throw new Error("Datos de campaña incompletos");
  if (!Number.isFinite(value) || value <= 0) throw new Error("Valor de descuento invalido");
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || startsAt >= endsAt) throw new Error("Rango de fechas invalido");
  if (!productIds.length) throw new Error("Seleccione al menos un producto");

  await prisma.$transaction(async (tx) => {
    await tx.discountCampaign.update({
      where: { id },
      data: { name, badgeLabel, badgeColor, discountType, startsAt, endsAt }
    });
    await tx.discountCampaignProduct.deleteMany({ where: { campaignId: id } });
    await tx.discountCampaignProduct.createMany({
      data: productIds.map((productSkuId) => ({ campaignId: id, productSkuId, value }))
    });
  });

  revalidatePath("/admin/descuentos");
  revalidatePath("/tienda");
  redirect("/admin/descuentos");
}
