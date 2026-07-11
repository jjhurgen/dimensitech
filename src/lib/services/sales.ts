import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { nextCode } from "@/lib/codes";
import { accessoryAverageCost, availableAccessoryStock } from "@/lib/inventory";
import { saleSchema } from "@/lib/validators";

export async function registerSale(input: unknown, userId: number) {
  const data = saleSchema.parse(input);

  return prisma.$transaction(async (tx) => {
    const documentNumber = data.customerDocumentNumber.trim();
    const fullName = data.customerFullName.trim().replace(/\s+/g, " ");
    const customer = await findOrCreateSaleCustomer(tx, {
      customerId: data.customerId ?? null,
      documentType: data.customerDocumentType,
      documentNumber,
      fullName
    });

    const saleCode = await nextCode(tx, "sale", "saleCode", "VENT");
    let subtotal = new Prisma.Decimal(0);
    let discountTotal = new Prisma.Decimal(0);
    let giftCostTotal = new Prisma.Decimal(0);
    let grossProfit = new Prisma.Decimal(0);
    let freightCost = new Prisma.Decimal(0);

    const sale = await tx.sale.create({
      data: {
        saleCode,
        saleDate: data.saleDate,
        customerId: customer.id,
        saleChannel: data.saleChannel,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        userId
      }
    });

    for (const item of data.items) {
      const sku = await tx.productSku.findUnique({
        where: { id: item.productSkuId },
        include: { productType: true }
      });
      if (!sku) throw new Error("Producto no existe");

      let unitCost = new Prisma.Decimal(0);
      let phoneUnitId = item.phoneUnitId ?? null;
      const totalSalePrice = new Prisma.Decimal(item.unitSalePrice).mul(item.quantity).minus(item.discount);

      if (item.itemType === "PHONE") {
        if (!phoneUnitId) throw new Error("IMEI requerido para vender celular");
        const unit = await tx.phoneUnit.findUnique({ where: { id: phoneUnitId } });
        if (!unit || unit.productSkuId !== item.productSkuId) throw new Error("Celular no valido");
        if (!["AVAILABLE", "RESERVED"].includes(unit.status)) throw new Error("Celular no disponible");
        unitCost = new Prisma.Decimal(unit.unitPurchasePrice).plus(unit.allocatedFreight ?? 0);
        freightCost = freightCost.plus(unit.allocatedFreight ?? 0);
        await tx.phoneUnit.update({ where: { id: unit.id }, data: { status: "SOLD", saleId: sale.id } });
      } else {
        const available = await availableAccessoryStock(item.productSkuId, tx);
        if (available < item.quantity) throw new Error(`Stock insuficiente para ${sku.name}`);
        unitCost = await accessoryAverageCost(item.productSkuId, tx);
      }

      const totalCost = unitCost.mul(item.quantity);
      const profit = totalSalePrice.minus(totalCost);
      subtotal = subtotal.plus(totalSalePrice);
      discountTotal = discountTotal.plus(item.discount);
      grossProfit = grossProfit.plus(profit);
      if (item.isGift) giftCostTotal = giftCostTotal.plus(totalCost);

      await tx.saleItem.create({
        data: {
          saleId: sale.id,
          productSkuId: item.productSkuId,
          phoneUnitId,
          itemType: item.itemType,
          quantity: item.quantity,
          unitSalePrice: item.unitSalePrice,
          unitCost,
          discount: item.discount,
          totalSalePrice,
          totalCost,
          isGift: item.isGift,
          profit
        }
      });

      await tx.inventoryMovement.create({
        data: {
          productSkuId: item.productSkuId,
          phoneUnitId,
          movementType: item.isGift ? "GIFT_OUT" : "SALE_OUT",
          quantity: item.quantity,
          unitCost,
          referenceType: "SALE",
          referenceId: sale.id,
          userId
        }
      });
    }

    const updated = await tx.sale.update({
      where: { id: sale.id },
      data: {
        subtotal,
        discountTotal,
        giftCostTotal,
        freightCostApplied: freightCost,
        total: subtotal,
        grossProfit,
        netProfitEstimated: grossProfit.minus(freightCost)
      }
    });

    await tx.notification.create({
      data: {
        type: "SALE_CONFIRMED",
        title: "Venta confirmada",
        message: `Se confirmo la venta ${sale.saleCode}`,
        userId
      }
    });

    return updated;
  });
}

async function findOrCreateSaleCustomer(
  tx: Prisma.TransactionClient,
  input: {
    customerId?: number | null;
    documentType: "DNI" | "CE" | "RUC";
    documentNumber: string;
    fullName: string;
  }
) {
  if (!input.documentNumber || !input.fullName) throw new Error("Cliente requerido");

  const existing = input.customerId
    ? await tx.customer.findUnique({ where: { id: input.customerId } })
    : await tx.customer.findUnique({ where: { dni: input.documentNumber } });

  const nameParts = splitCustomerName(input.fullName, input.documentType);
  if (existing) {
    return tx.customer.update({
      where: { id: existing.id },
      data: {
        dni: input.documentNumber,
        documentType: input.documentType,
        firstNames: nameParts.firstNames,
        lastNames: nameParts.lastNames
      }
    });
  }

  return tx.customer.create({
    data: {
      dni: input.documentNumber,
      documentType: input.documentType,
      firstNames: nameParts.firstNames,
      lastNames: nameParts.lastNames
    }
  });
}

function splitCustomerName(fullName: string, documentType: "DNI" | "CE" | "RUC") {
  if (documentType === "RUC") return { firstNames: fullName, lastNames: "" };
  const parts = fullName.split(" ").filter(Boolean);
  if (parts.length <= 2) return { firstNames: fullName, lastNames: "" };
  const lastNames = parts.slice(0, 2).join(" ");
  const firstNames = parts.slice(2).join(" ") || fullName;
  return { firstNames, lastNames };
}

export async function findPhoneByImei(imei: string) {
  return prisma.phoneUnit.findFirst({
    where: { OR: [{ imei1: imei }, { imei2: imei }] },
    include: { productSku: true, purchase: { include: { provider: true } } }
  });
}
