import { DiscountType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type ActivePromotion = {
  productSkuId: number;
  campaignId: number;
  campaignName: string;
  badgeLabel: string;
  badgeColor: string;
  discountType: DiscountType;
  value: number;
  originalPrice: number;
  finalPrice: number;
  discountAmount: number;
};

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function calculateDiscountedPrice(basePrice: number, discountType: DiscountType, value: number) {
  if (discountType === "FIXED_AMOUNT") return Math.max(roundMoney(basePrice - value), 0);
  if (discountType === "PERCENTAGE") return Math.max(roundMoney(basePrice * (1 - value / 100)), 0);
  return Math.max(roundMoney(value), 0);
}

export async function activePromotionsForProducts(productSkuIds: number[], now = new Date()) {
  const ids = Array.from(new Set(productSkuIds.filter(Boolean)));
  if (!ids.length) return new Map<number, ActivePromotion>();

  const rows = await prisma.discountCampaignProduct.findMany({
    where: {
      productSkuId: { in: ids },
      campaign: {
        isActive: true,
        startsAt: { lte: now },
        endsAt: { gte: now }
      }
    },
    include: {
      productSku: true,
      campaign: true
    },
    orderBy: [{ campaign: { startsAt: "desc" } }, { id: "desc" }]
  });

  const result = new Map<number, ActivePromotion>();
  for (const row of rows) {
    const originalPrice = Number(row.productSku.suggestedSalePrice);
    const value = Number(row.value);
    const finalPrice = calculateDiscountedPrice(originalPrice, row.campaign.discountType, value);
    if (finalPrice >= originalPrice) continue;
    const promotion: ActivePromotion = {
      productSkuId: row.productSkuId,
      campaignId: row.campaignId,
      campaignName: row.campaign.name,
      badgeLabel: row.campaign.badgeLabel,
      badgeColor: row.campaign.badgeColor,
      discountType: row.campaign.discountType,
      value,
      originalPrice,
      finalPrice,
      discountAmount: roundMoney(originalPrice - finalPrice)
    };
    const current = result.get(row.productSkuId);
    if (!current || promotion.finalPrice < current.finalPrice) result.set(row.productSkuId, promotion);
  }
  return result;
}

export async function activePromotionForProduct(productSkuId: number, now = new Date()) {
  return (await activePromotionsForProducts([productSkuId], now)).get(productSkuId) ?? null;
}

export function decimalOrNull(value: number | null | undefined) {
  return value == null ? null : new Prisma.Decimal(value);
}
