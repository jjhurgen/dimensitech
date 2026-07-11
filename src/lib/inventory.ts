import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type Tx = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

export async function availableAccessoryStock(productSkuId: number, tx: Tx = prisma) {
  const physical = await physicalAccessoryStock(productSkuId, tx);
  const reserved = await reservedAccessoryStock(productSkuId, tx);
  return Math.max(physical - reserved, 0);
}

export async function physicalAccessoryStock(productSkuId: number, tx: Tx = prisma) {
  const rows = await tx.inventoryMovement.groupBy({
    by: ["movementType"],
    where: { productSkuId, phoneUnitId: null },
    _sum: { quantity: true }
  });
  return rows.reduce((stock, row) => {
    const qty = row._sum.quantity ?? 0;
    if (["PURCHASE_IN", "RETURN_IN", "ADJUSTMENT_IN"].includes(row.movementType)) {
      return stock + qty;
    }
    if (["RESERVATION_HOLD", "RESERVATION_RELEASE"].includes(row.movementType)) return stock;
    return stock - qty;
  }, 0);
}

export async function reservedAccessoryStock(productSkuId: number, tx: Tx = prisma) {
  const rows = await tx.reservationItem.aggregate({
    where: {
      productSkuId,
      status: "PENDING",
      phoneUnitId: null,
      reservation: { status: "PENDING", expiresAt: { gt: new Date() } }
    },
    _sum: { quantityRequested: true, quantityConfirmed: true }
  });
  return (rows._sum.quantityRequested ?? 0) - (rows._sum.quantityConfirmed ?? 0);
}

export async function accessoryAverageCost(productSkuId: number, tx: Tx = prisma) {
  const rows = await tx.inventoryMovement.findMany({
    where: { productSkuId, phoneUnitId: null, movementType: "PURCHASE_IN" },
    select: { quantity: true, unitCost: true }
  });
  const totals = rows.reduce(
    (acc, row) => {
      acc.qty += row.quantity;
      acc.cost += row.quantity * Number(row.unitCost);
      return acc;
    },
    { qty: 0, cost: 0 }
  );
  return totals.qty ? new Prisma.Decimal(totals.cost / totals.qty) : new Prisma.Decimal(0);
}

export async function webStock(productSkuId: number) {
  const sku = await prisma.productSku.findUnique({
    where: { id: productSkuId },
    include: { productType: true }
  });
  if (!sku) return 0;
  if (sku.productType.requiresImei) {
    return prisma.phoneUnit.count({ where: { productSkuId, status: "AVAILABLE" } });
  }
  return availableAccessoryStock(productSkuId);
}
