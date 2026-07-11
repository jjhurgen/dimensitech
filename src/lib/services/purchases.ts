import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { nextCode } from "@/lib/codes";
import { purchaseSchema } from "@/lib/validators";

export async function registerPurchase(input: unknown, userId: number) {
  const data = purchaseSchema.parse(input);

  return prisma.$transaction(async (tx) => {
    const provider = await tx.provider.findUnique({ where: { id: data.providerId } });
    if (!provider) throw new Error("Proveedor no existe");

    const purchaseCode = await nextCode(tx, "purchase", "purchaseCode", "COMP");
    const totalUnits = data.items.reduce((sum, item) => sum + item.quantity, 0);
    const freightPerUnit = totalUnits > 0 ? data.freightAmount / totalUnits : 0;

    const purchase = await tx.purchase.create({
      data: {
        purchaseCode,
        purchaseDate: data.purchaseDate,
        providerId: data.providerId,
        freightAmount: data.freightAmount,
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
      if (sku.productType.requiresImei && item.phones?.length !== item.quantity) {
        throw new Error("Cada celular debe tener IMEI");
      }

      const purchaseItem = await tx.purchaseItem.create({
        data: {
          purchaseId: purchase.id,
          productSkuId: sku.id,
          productType: sku.productType.name,
          quantity: item.quantity,
          unitPurchasePrice: item.unitPurchasePrice,
          totalPrice: item.quantity * item.unitPurchasePrice,
          allocatedFreight: freightPerUnit
        }
      });

      if (sku.productType.requiresImei) {
        const isIphone = sku.platform === "IPHONE";
        for (const phone of item.phones ?? []) {
          const exists = await tx.phoneUnit.findFirst({
            where: { OR: [{ imei1: phone.imei1 }, phone.imei2 ? { imei2: phone.imei2 } : { id: -1 }] }
          });
          if (exists) throw new Error(`IMEI duplicado: ${phone.imei1}`);

          const unit = await tx.phoneUnit.create({
            data: {
              productSkuId: sku.id,
              purchaseId: purchase.id,
              purchaseItemId: purchaseItem.id,
              imei1: phone.imei1,
              imei2: phone.imei2 || null,
              serialNumber: isIphone ? phone.serialNumber || null : null,
              modelNumber: isIphone ? phone.modelNumber || sku.modelNumber : null,
              platform: sku.platform ?? "ANDROID",
              color: sku.color,
              storage: sku.storage,
              ram: sku.ram,
              unitPurchasePrice: item.unitPurchasePrice,
              allocatedFreight: freightPerUnit,
              whiteListRegistered: phone.whiteListRegistered,
              status: "AVAILABLE"
            }
          });

          if (isIphone && phone.modelNumber2) {
            await tx.$executeRaw`UPDATE phone_units SET model_number_2 = ${phone.modelNumber2} WHERE id = ${unit.id}`;
          }

          await tx.inventoryMovement.create({
            data: {
              productSkuId: sku.id,
              phoneUnitId: unit.id,
              movementType: "PURCHASE_IN",
              quantity: 1,
              unitCost: new Prisma.Decimal(item.unitPurchasePrice).plus(freightPerUnit),
              referenceType: "PURCHASE",
              referenceId: purchase.id,
              userId
            }
          });
        }
      } else {
        await tx.inventoryMovement.create({
          data: {
            productSkuId: sku.id,
            movementType: "PURCHASE_IN",
            quantity: item.quantity,
            unitCost: new Prisma.Decimal(item.unitPurchasePrice).plus(freightPerUnit),
            referenceType: "PURCHASE",
            referenceId: purchase.id,
            userId
          }
        });
      }
    }

    await tx.notification.create({
      data: {
        type: "PURCHASE_REGISTERED",
        title: "Compra registrada",
        message: `Se registro la compra ${purchase.purchaseCode}`,
        userId
      }
    });

    return purchase;
  });
}

export async function cancelPurchase(purchaseId: number, userId: number) {
  return prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.findUnique({
      where: { id: purchaseId },
      include: { phoneUnits: true, items: true }
    });
    if (!purchase || purchase.status === "CANCELLED") throw new Error("Compra no valida");
    if (purchase.phoneUnits.some((unit) => unit.status !== "AVAILABLE")) {
      throw new Error("No se puede anular una compra con celulares reservados o vendidos");
    }

    await tx.phoneUnit.updateMany({ where: { purchaseId }, data: { status: "CANCELLED" } });
    await tx.purchase.update({ where: { id: purchaseId }, data: { status: "CANCELLED" } });
    await tx.inventoryMovement.createMany({
      data: purchase.items.map((item) => ({
        productSkuId: item.productSkuId,
        movementType: "CANCELLED",
        quantity: item.quantity,
        unitCost: item.unitPurchasePrice,
        referenceType: "PURCHASE",
        referenceId: purchaseId,
        userId
      }))
    });
  });
}
