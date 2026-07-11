import { addMinutes } from "date-fns";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { nextCode } from "@/lib/codes";
import { accessoryAverageCost, availableAccessoryStock, webStock } from "@/lib/inventory";
import { reservationSchema } from "@/lib/validators";

export async function createReservation(input: unknown) {
  const data = reservationSchema.parse(input);
  await expireReservations();

  return prisma.$transaction(async (tx) => {
    const minutesSetting = await tx.setting.findUnique({ where: { key: "reservation_expiration_minutes" } });
    const hoursSetting = await tx.setting.findUnique({ where: { key: "reservation_expiration_hours" } });
    const rawExpirationMinutes = minutesSetting ? Number(minutesSetting.value) : Number(hoursSetting?.value ?? 24) * 60;
    const expirationMinutes = Number.isFinite(rawExpirationMinutes) && rawExpirationMinutes > 0 ? rawExpirationMinutes : 1440;
    const reservationCode = await nextCode(tx, "reservation", "reservationCode", "RES");
    let totalEstimated = 0;
    const productLines: string[] = [];

    for (const item of data.items) {
      const sku = await tx.productSku.findUnique({
        where: { id: item.productSkuId },
        include: { productType: true }
      });
      if (!sku) throw new Error("Producto no existe");
      const stock = sku.productType.requiresImei
        ? await tx.phoneUnit.count({ where: { productSkuId: sku.id, status: "AVAILABLE" } })
        : await availableAccessoryStock(sku.id, tx);
      if (stock < item.quantityRequested) throw new Error(`Stock insuficiente para ${sku.name}`);
      totalEstimated += item.quantityRequested * item.unitPrice;
      productLines.push(`- ${sku.brand} ${sku.name} x${item.quantityRequested}${item.discountLabel ? ` (${item.discountLabel})` : ""}`);
    }

    const reservation = await tx.reservation.create({
      data: {
        reservationCode,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerDni: data.customerDni,
        shippingType: data.shippingType,
        destinationDepartment: data.destinationDepartment,
        destinationProvince: data.destinationProvince,
        destinationCity: data.destinationCity,
        addressReference: data.addressReference,
        expiresAt: addMinutes(new Date(), expirationMinutes),
        totalEstimated,
        notes: data.notes
      }
    });

    for (const item of data.items) {
      const sku = await tx.productSku.findUnique({
        where: { id: item.productSkuId },
        include: { productType: true }
      });
      if (!sku) throw new Error("Producto no existe");

      if (sku.productType.requiresImei) {
        const units = await tx.phoneUnit.findMany({
          where: { productSkuId: sku.id, status: "AVAILABLE" },
          take: item.quantityRequested,
          orderBy: { createdAt: "asc" }
        });
        for (const unit of units) {
          await tx.phoneUnit.update({
            where: { id: unit.id },
            data: { status: "RESERVED", currentReservationId: reservation.id }
          });
          await tx.reservationItem.create({
            data: {
              reservationId: reservation.id,
              productSkuId: sku.id,
              phoneUnitId: unit.id,
              quantityRequested: 1,
              unitPrice: item.unitPrice,
              originalUnitPrice: item.originalUnitPrice ?? item.unitPrice,
              discountUnitAmount: item.discountUnitAmount ?? 0,
              discountLabel: item.discountLabel || null,
              discountCampaignName: item.discountCampaignName || null
            }
          });
          await tx.inventoryMovement.create({
            data: {
              productSkuId: sku.id,
              phoneUnitId: unit.id,
              movementType: "RESERVATION_HOLD",
              quantity: 1,
              unitCost: unit.unitPurchasePrice,
              referenceType: "RESERVATION",
              referenceId: reservation.id
            }
          });
        }
      } else {
        await tx.reservationItem.create({
          data: {
            reservationId: reservation.id,
            productSkuId: sku.id,
            quantityRequested: item.quantityRequested,
            unitPrice: item.unitPrice,
            originalUnitPrice: item.originalUnitPrice ?? item.unitPrice,
            discountUnitAmount: item.discountUnitAmount ?? 0,
            discountLabel: item.discountLabel || null,
            discountCampaignName: item.discountCampaignName || null
          }
        });
        await tx.inventoryMovement.create({
          data: {
            productSkuId: sku.id,
            movementType: "RESERVATION_HOLD",
            quantity: item.quantityRequested,
            unitCost: 0,
            referenceType: "RESERVATION",
            referenceId: reservation.id
          }
        });
      }
    }

    const shippingLabel =
      data.shippingType === "STORE_PICKUP"
        ? "Recojo en tienda"
        : data.shippingType === "LIMA"
          ? "Envio a Lima"
          : data.shippingType === "DELIVERY"
            ? "Delivery en Huaraz"
            : "Envio a provincia";
    const destinationLabel =
      data.shippingType === "STORE_PICKUP"
        ? "Recojo en tienda"
        : data.shippingType === "LIMA"
          ? [`Distrito: ${data.destinationCity}`, data.addressReference].filter(Boolean).join(" | ")
          : data.shippingType === "DELIVERY"
            ? data.addressReference ?? "Huaraz"
            : [data.destinationCity, data.destinationProvince, data.destinationDepartment].filter(Boolean).join(", ") + (data.addressReference ? ` | ${data.addressReference}` : "");
    const message = `Hola DIMENSITECH, deseo realizar esta solicitud de compra:

Producto(s):
${productLines.join("\n")}
Total estimado: S/ ${totalEstimated.toFixed(2)}
Tipo de entrega: ${shippingLabel}
Destino: ${destinationLabel || "Por confirmar"}
Nombre: ${data.customerName}
Telefono: ${data.customerPhone}
Documento: ${data.customerDni || "No indicado"}
Costo de envio: segun destino

Codigo de reserva: ${reservationCode}
Tiempo para confirmar pago: ${expirationMinutes < 60 ? `${expirationMinutes} min` : `${expirationMinutes / 60} h`}

Quedo atento a la confirmacion.`;
    const updatedReservation = await tx.reservation.update({ where: { id: reservation.id }, data: { whatsappMessage: message } });
    await tx.notification.create({
      data: {
        type: "NEW_RESERVATION",
        title: "Nueva solicitud de compra",
        message: `Pedido ${reservationCode}: ${productLines.map((line) => line.replace(/^- /, "")).join(", ")} - Cliente: ${data.customerName}`
      }
    });
    return updatedReservation;
  });
}

export async function expireReservations() {
  return prisma.$transaction(async (tx) => {
    const now = new Date();
    const expired = await tx.reservation.findMany({
      where: { status: "PENDING", expiresAt: { lte: now } },
      include: { items: true }
    });
    let expiredCount = 0;

    for (const reservation of expired) {
      const updated = await tx.reservation.updateMany({
        where: { id: reservation.id, status: "PENDING" },
        data: { status: "EXPIRED" }
      });
      if (!updated.count) continue;

      await tx.phoneUnit.updateMany({
        where: { currentReservationId: reservation.id, status: "RESERVED" },
        data: { status: "AVAILABLE", currentReservationId: null }
      });
      const pendingItems = reservation.items.filter((row) => row.status === "PENDING");

      for (const item of pendingItems) {
        const quantity = item.quantityRequested - item.quantityConfirmed;
        if (quantity <= 0) continue;
        await tx.inventoryMovement.create({
          data: {
            productSkuId: item.productSkuId,
            phoneUnitId: item.phoneUnitId,
            movementType: "RESERVATION_RELEASE",
            quantity,
            unitCost: 0,
            referenceType: "RESERVATION",
            referenceId: reservation.id
          }
        });
      }
      if (pendingItems.length) {
        await tx.reservationItem.updateMany({
          where: { id: { in: pendingItems.map((item) => item.id) }, status: "PENDING" },
          data: { status: "EXPIRED" }
        });
      }
      await tx.notification.create({
        data: {
          type: "RESERVATION_EXPIRED",
          title: "Reserva vencida",
          message: `La reserva ${reservation.reservationCode} vencio y libero stock.`
        }
      });
      expiredCount += 1;
    }
    return expiredCount;
  });
}

export async function productWebStock(productSkuId: number) {
  return webStock(productSkuId);
}

export async function cancelReservation(reservationId: number, userId?: number) {
  return prisma.$transaction(async (tx) => {
    const reservation = await tx.reservation.findUnique({ where: { id: reservationId }, include: { items: true } });
    if (!reservation || reservation.status !== "PENDING") throw new Error("Reserva no valida");

    await tx.reservation.update({ where: { id: reservationId }, data: { status: "CANCELLED" } });
    await tx.phoneUnit.updateMany({
      where: { currentReservationId: reservationId, status: "RESERVED" },
      data: { status: "AVAILABLE", currentReservationId: null }
    });

    for (const item of reservation.items.filter((row) => row.status === "PENDING")) {
      await tx.reservationItem.update({ where: { id: item.id }, data: { status: "CANCELLED" } });
      await tx.inventoryMovement.create({
        data: {
          productSkuId: item.productSkuId,
          phoneUnitId: item.phoneUnitId,
          movementType: "RESERVATION_RELEASE",
          quantity: item.quantityRequested - item.quantityConfirmed,
          unitCost: 0,
          referenceType: "RESERVATION",
          referenceId: reservationId,
          userId
        }
      });
    }

    await tx.notification.create({
      data: {
        type: "RESERVATION_EXPIRED",
        title: "Reserva cancelada",
        message: `La reserva ${reservation.reservationCode} fue cancelada y libero stock.`,
        userId
      }
    });
  });
}

export async function cancelReservationItem(reservationItemId: number, userId?: number) {
  return prisma.$transaction(async (tx) => {
    const item = await tx.reservationItem.findUnique({
      where: { id: reservationItemId },
      include: {
        reservation: { include: { items: true } },
        productSku: { include: { productType: true } },
        phoneUnit: true
      }
    });
    if (!item || item.status !== "PENDING" || item.reservation.status !== "PENDING") {
      throw new Error("Item de reserva no valido");
    }

    const releaseQuantity = item.quantityRequested - item.quantityConfirmed;

    if (item.phoneUnitId) {
      await tx.phoneUnit.update({
        where: { id: item.phoneUnitId },
        data: { status: "AVAILABLE", currentReservationId: null }
      });
    }

    await tx.inventoryMovement.create({
      data: {
        productSkuId: item.productSkuId,
        phoneUnitId: item.phoneUnitId,
        movementType: "RESERVATION_RELEASE",
        quantity: releaseQuantity,
        unitCost: 0,
        referenceType: "RESERVATION",
        referenceId: item.reservationId,
        userId
      }
    });

    await tx.reservationItem.update({
      where: { id: item.id },
      data: { status: "CANCELLED" }
    });

    const remainingItems = item.reservation.items.filter((row) => row.id !== item.id && row.status === "PENDING");
    const nextTotal = remainingItems.reduce((sum, row) => sum + Number(row.unitPrice) * row.quantityRequested, 0);
    const nextStatus = remainingItems.length ? "PENDING" : "CANCELLED";

    await tx.reservation.update({
      where: { id: item.reservationId },
      data: { totalEstimated: nextTotal, status: nextStatus }
    });

    await tx.notification.create({
      data: {
        type: "RESERVATION_EXPIRED",
        title: "Item de reserva anulado",
        message: `Se anulo un item de la reserva ${item.reservation.reservationCode} y se libero stock.`,
        userId
      }
    });
  });
}

export async function confirmReservationSale(reservationId: number, userId: number) {
  return prisma.$transaction(async (tx) => {
    const reservation = await tx.reservation.findUnique({
      where: { id: reservationId },
      include: { items: { include: { productSku: { include: { productType: true } }, phoneUnit: true } } }
    });
    if (!reservation || reservation.status !== "PENDING") throw new Error("Reserva no valida");
    const pendingItems = reservation.items.filter((item) => item.status === "PENDING");
    if (!pendingItems.length) throw new Error("La reserva no tiene items pendientes para vender");

    const customer = await tx.customer.upsert({
      where: { dni: reservation.customerDni || `RES-${reservation.reservationCode}` },
      update: {
        firstNames: reservation.customerName,
        phone: reservation.customerPhone,
        city: reservation.destinationCity,
        address: reservation.addressReference
      },
      create: {
        dni: reservation.customerDni || `RES-${reservation.reservationCode}`,
        firstNames: reservation.customerName,
        lastNames: "-",
        phone: reservation.customerPhone,
        city: reservation.destinationCity,
        address: reservation.addressReference
      }
    });

    const saleCode = await nextCode(tx, "sale", "saleCode", "VENT");
    const sale = await tx.sale.create({
      data: {
        saleCode,
        saleDate: new Date(),
        customerId: customer.id,
        saleChannel: "WEB",
        paymentMethod: "CASH",
        notes: `Venta generada desde reserva ${reservation.reservationCode}`,
        userId
      }
    });

    let subtotal = new Prisma.Decimal(0);
    let grossProfit = new Prisma.Decimal(0);
    let freightCost = new Prisma.Decimal(0);

    for (const item of pendingItems) {
      const quantity = item.quantityRequested;
      let unitCost = new Prisma.Decimal(0);
      let movementQuantity = quantity;

      if (item.productSku.productType.requiresImei) {
        if (!item.phoneUnitId || !item.phoneUnit) throw new Error("Reserva de celular sin unidad");
        unitCost = new Prisma.Decimal(item.phoneUnit.unitPurchasePrice).plus(item.phoneUnit.allocatedFreight ?? 0);
        freightCost = freightCost.plus(item.phoneUnit.allocatedFreight ?? 0);
        movementQuantity = 1;
        await tx.phoneUnit.update({
          where: { id: item.phoneUnitId },
          data: { status: "SOLD", saleId: sale.id, currentReservationId: null }
        });
      } else {
        unitCost = await accessoryAverageCost(item.productSkuId, tx);
      }

      const originalUnitPrice = new Prisma.Decimal(item.originalUnitPrice ?? item.unitPrice);
      const discount = originalUnitPrice.minus(item.unitPrice).mul(quantity);
      const totalSalePrice = new Prisma.Decimal(item.unitPrice).mul(quantity);
      const totalCost = unitCost.mul(quantity);
      const profit = totalSalePrice.minus(totalCost);
      subtotal = subtotal.plus(totalSalePrice);
      grossProfit = grossProfit.plus(profit);

      await tx.saleItem.create({
        data: {
          saleId: sale.id,
          productSkuId: item.productSkuId,
          phoneUnitId: item.phoneUnitId,
          itemType: item.productSku.productType.requiresImei ? "PHONE" : "ACCESSORY",
          quantity,
          unitSalePrice: originalUnitPrice,
          unitCost,
          discount: discount.gt(0) ? discount : 0,
          totalSalePrice,
          totalCost,
          isGift: false,
          profit
        }
      });

      await tx.inventoryMovement.create({
        data: {
          productSkuId: item.productSkuId,
          phoneUnitId: item.phoneUnitId,
          movementType: "SALE_OUT",
          quantity: movementQuantity,
          unitCost,
          referenceType: "SALE",
          referenceId: sale.id,
          userId
        }
      });

      await tx.reservationItem.update({
        where: { id: item.id },
        data: { quantityConfirmed: quantity, status: "CONFIRMED" }
      });
    }

    await tx.sale.update({
      where: { id: sale.id },
      data: {
        subtotal,
        total: subtotal,
        grossProfit,
        freightCostApplied: freightCost,
        netProfitEstimated: grossProfit.minus(freightCost)
      }
    });
    const hasCancelledItems = reservation.items.some((item) => item.status === "CANCELLED");
    await tx.reservation.update({ where: { id: reservationId }, data: { status: hasCancelledItems ? "PARTIAL_CONFIRMED" : "CONFIRMED" } });
    await tx.notification.create({
      data: {
        type: "SALE_CONFIRMED",
        title: "Reserva confirmada",
        message: `La reserva ${reservation.reservationCode} se convirtio en venta ${sale.saleCode}.`,
        userId
      }
    });
    return sale;
  });
}
