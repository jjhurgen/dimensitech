import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DEMO = "[DEMO]";

type Tx = Prisma.TransactionClient;

async function nextCode(tx: Tx, model: "purchase" | "sale" | "reservation", field: "purchaseCode" | "saleCode" | "reservationCode", prefix: string) {
  const rows = await (tx[model] as any).findMany({ select: { [field]: true } });
  const max = rows.reduce((highest: number, row: any) => {
    const value = String(row[field] ?? "");
    const match = value.match(new RegExp(`^${prefix}-(\\d+)$`));
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
  return `${prefix}-${String(max + 1).padStart(6, "0")}`;
}

async function ensureProvider(tx: Tx, data: Prisma.ProviderCreateInput) {
  const existing = data.dniRuc ? await tx.provider.findFirst({ where: { dniRuc: data.dniRuc } }) : null;
  if (existing) return tx.provider.update({ where: { id: existing.id }, data });
  return tx.provider.create({ data });
}

async function ensureCustomer(tx: Tx, data: Prisma.CustomerCreateInput) {
  const existing = data.dni ? await tx.customer.findUnique({ where: { dni: data.dni } }) : null;
  if (existing) return tx.customer.update({ where: { id: existing.id }, data });
  return tx.customer.create({ data });
}

async function ensureImage(tx: Tx, data: Prisma.ProductImageLibraryUncheckedCreateInput & { imageHash: string }) {
  const existing = await tx.productImageLibrary.findFirst({ where: { imageHash: data.imageHash } });
  if (existing) return tx.productImageLibrary.update({ where: { id: existing.id }, data });
  return tx.productImageLibrary.create({ data });
}

async function ensureSku(tx: Tx, data: Prisma.ProductSkuUncheckedCreateInput) {
  return tx.productSku.upsert({
    where: { skuCode: data.skuCode },
    update: data,
    create: data
  });
}

async function createPurchaseDemo(tx: Tx, userId: number, providerId: number, skus: Record<string, number>) {
  const exists = await tx.purchase.findFirst({ where: { notes: { contains: `${DEMO} compra inicial` } } });
  if (exists) return exists;

  const purchaseCode = await nextCode(tx, "purchase", "purchaseCode", "COMP");
  const purchase = await tx.purchase.create({
    data: {
      purchaseCode,
      purchaseDate: new Date("2026-07-05T10:00:00-05:00"),
      providerId,
      freightAmount: 180,
      notes: `${DEMO} compra inicial con celulares, IMEI y accesorios`,
      userId
    }
  });

  const lines = [
    {
      skuId: skus.iphone,
      productType: "Celular",
      quantity: 2,
      cost: 2450,
      phones: [
        { imei1: "359111111111101", imei2: "359111111111102", serialNumber: "F2LDEMOIPH1501", modelNumber: "A3090", modelNumber2: "MTML3LL/A" },
        { imei1: "359111111111201", imei2: "359111111111202", serialNumber: "F2LDEMOIPH1502", modelNumber: "A3090", modelNumber2: "MTML3LL/A" }
      ]
    },
    {
      skuId: skus.galaxy,
      productType: "Celular",
      quantity: 2,
      cost: 2180,
      phones: [
        { imei1: "359222222222101", imei2: "359222222222102", serialNumber: "R5CDEMO24101" },
        { imei1: "359222222222201", imei2: "359222222222202", serialNumber: "R5CDEMO24201" }
      ]
    },
    {
      skuId: skus.redmi,
      productType: "Celular",
      quantity: 3,
      cost: 620,
      phones: [
        { imei1: "359333333333101", imei2: "359333333333102", serialNumber: "XMDEMO1301" },
        { imei1: "359333333333201", imei2: "359333333333202", serialNumber: "XMDEMO1302" },
        { imei1: "359333333333301", imei2: "359333333333302", serialNumber: "XMDEMO1303" }
      ]
    },
    { skuId: skus.cubo, productType: "Cubo", quantity: 20, cost: 26 },
    { skuId: skus.cable, productType: "Cable", quantity: 30, cost: 12 },
    { skuId: skus.caseIphone, productType: "Case", quantity: 15, cost: 15 },
    { skuId: skus.mica, productType: "Mica", quantity: 25, cost: 7 }
  ];

  const totalUnits = lines.reduce((sum, line) => sum + line.quantity, 0);
  const freightPerUnit = new Prisma.Decimal(180).div(totalUnits);

  for (const line of lines) {
    const item = await tx.purchaseItem.create({
      data: {
        purchaseId: purchase.id,
        productSkuId: line.skuId,
        productType: line.productType,
        quantity: line.quantity,
        unitPurchasePrice: line.cost,
        totalPrice: new Prisma.Decimal(line.cost).mul(line.quantity),
        allocatedFreight: freightPerUnit
      }
    });

    if ("phones" in line && line.phones) {
      const sku = await tx.productSku.findUniqueOrThrow({ where: { id: line.skuId } });
      for (const phone of line.phones) {
        const unit = await tx.phoneUnit.create({
          data: {
            productSkuId: line.skuId,
            purchaseId: purchase.id,
            purchaseItemId: item.id,
            imei1: phone.imei1,
            imei2: phone.imei2,
            serialNumber: phone.serialNumber,
            modelNumber: "modelNumber" in phone ? phone.modelNumber : sku.modelNumber,
            modelNumber2: "modelNumber2" in phone ? phone.modelNumber2 : null,
            platform: sku.platform ?? "ANDROID",
            color: sku.color,
            storage: sku.storage,
            ram: sku.ram,
            unitPurchasePrice: line.cost,
            allocatedFreight: freightPerUnit
          }
        });
        await tx.inventoryMovement.create({
          data: {
            productSkuId: line.skuId,
            phoneUnitId: unit.id,
            movementType: "PURCHASE_IN",
            quantity: 1,
            unitCost: new Prisma.Decimal(line.cost).plus(freightPerUnit),
            referenceType: "PURCHASE",
            referenceId: purchase.id,
            userId
          }
        });
      }
    } else {
      await tx.inventoryMovement.create({
        data: {
          productSkuId: line.skuId,
          movementType: "PURCHASE_IN",
          quantity: line.quantity,
          unitCost: new Prisma.Decimal(line.cost).plus(freightPerUnit),
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
      title: "Compra demo registrada",
      message: `Se registro la compra demo ${purchase.purchaseCode}`,
      userId
    }
  });

  return purchase;
}

async function createSaleDemo(tx: Tx, userId: number, customerId: number, skus: Record<string, number>) {
  const exists = await tx.sale.findFirst({ where: { notes: { contains: `${DEMO} venta mostrador` } } });
  if (exists) return exists;

  const phone = await tx.phoneUnit.findFirst({
    where: { productSkuId: skus.iphone, status: "AVAILABLE" },
    orderBy: { id: "asc" }
  });
  if (!phone) throw new Error("No hay iPhone disponible para la venta demo");

  const saleCode = await nextCode(tx, "sale", "saleCode", "VENT");
  const sale = await tx.sale.create({
    data: {
      saleCode,
      saleDate: new Date("2026-07-06T16:30:00-05:00"),
      customerId,
      saleChannel: "STORE",
      paymentMethod: "YAPE",
      notes: `${DEMO} venta mostrador con celular y regalo`,
      userId
    }
  });

  const phoneCost = new Prisma.Decimal(phone.unitPurchasePrice).plus(phone.allocatedFreight ?? 0);
  const phonePrice = new Prisma.Decimal(3150);
  const caseCost = new Prisma.Decimal(15).plus(new Prisma.Decimal(180).div(97));

  await tx.phoneUnit.update({ where: { id: phone.id }, data: { status: "SOLD", saleId: sale.id } });
  await tx.saleItem.create({
    data: {
      saleId: sale.id,
      productSkuId: skus.iphone,
      phoneUnitId: phone.id,
      itemType: "PHONE",
      quantity: 1,
      unitSalePrice: phonePrice,
      unitCost: phoneCost,
      discount: 49,
      totalSalePrice: phonePrice.minus(49),
      totalCost: phoneCost,
      profit: phonePrice.minus(49).minus(phoneCost)
    }
  });
  await tx.inventoryMovement.create({
    data: {
      productSkuId: skus.iphone,
      phoneUnitId: phone.id,
      movementType: "SALE_OUT",
      quantity: 1,
      unitCost: phoneCost,
      referenceType: "SALE",
      referenceId: sale.id,
      userId
    }
  });

  await tx.saleItem.create({
    data: {
      saleId: sale.id,
      productSkuId: skus.caseIphone,
      itemType: "ACCESSORY",
      quantity: 1,
      unitSalePrice: 0,
      unitCost: caseCost,
      discount: 0,
      totalSalePrice: 0,
      totalCost: caseCost,
      isGift: true,
      profit: caseCost.neg()
    }
  });
  await tx.inventoryMovement.create({
    data: {
      productSkuId: skus.caseIphone,
      movementType: "GIFT_OUT",
      quantity: 1,
      unitCost: caseCost,
      referenceType: "SALE",
      referenceId: sale.id,
      userId
    }
  });

  const subtotal = phonePrice.minus(49);
  const grossProfit = subtotal.minus(phoneCost).minus(caseCost);
  await tx.sale.update({
    where: { id: sale.id },
    data: {
      subtotal,
      discountTotal: 49,
      giftCostTotal: caseCost,
      freightCostApplied: phone.allocatedFreight,
      total: subtotal,
      grossProfit,
      netProfitEstimated: grossProfit.minus(phone.allocatedFreight ?? 0)
    }
  });

  await tx.notification.create({
    data: {
      type: "SALE_CONFIRMED",
      title: "Venta demo confirmada",
      message: `Se confirmo la venta demo ${sale.saleCode}`,
      userId
    }
  });

  return sale;
}

async function createAccessorySaleDemo(tx: Tx, userId: number, customerId: number, skus: Record<string, number>) {
  const exists = await tx.sale.findFirst({ where: { notes: { contains: `${DEMO} venta accesorios` } } });
  if (exists) return exists;

  const saleCode = await nextCode(tx, "sale", "saleCode", "VENT");
  const sale = await tx.sale.create({
    data: {
      saleCode,
      saleDate: new Date("2026-07-07T12:15:00-05:00"),
      customerId,
      saleChannel: "WHATSAPP",
      paymentMethod: "TRANSFER",
      notes: `${DEMO} venta accesorios por WhatsApp`,
      userId
    }
  });

  const lines = [
    { skuId: skus.cubo, quantity: 2, price: 69, cost: 26 },
    { skuId: skus.cable, quantity: 2, price: 39, cost: 12 },
    { skuId: skus.mica, quantity: 1, price: 29, cost: 7 }
  ];

  let subtotal = new Prisma.Decimal(0);
  let grossProfit = new Prisma.Decimal(0);
  const freightPerUnit = new Prisma.Decimal(180).div(97);

  for (const line of lines) {
    const unitCost = new Prisma.Decimal(line.cost).plus(freightPerUnit);
    const totalSalePrice = new Prisma.Decimal(line.price).mul(line.quantity);
    const totalCost = unitCost.mul(line.quantity);
    subtotal = subtotal.plus(totalSalePrice);
    grossProfit = grossProfit.plus(totalSalePrice.minus(totalCost));
    await tx.saleItem.create({
      data: {
        saleId: sale.id,
        productSkuId: line.skuId,
        itemType: "ACCESSORY",
        quantity: line.quantity,
        unitSalePrice: line.price,
        unitCost,
        discount: 0,
        totalSalePrice,
        totalCost,
        profit: totalSalePrice.minus(totalCost)
      }
    });
    await tx.inventoryMovement.create({
      data: {
        productSkuId: line.skuId,
        movementType: "SALE_OUT",
        quantity: line.quantity,
        unitCost,
        referenceType: "SALE",
        referenceId: sale.id,
        userId
      }
    });
  }

  await tx.sale.update({
    where: { id: sale.id },
    data: { subtotal, total: subtotal, grossProfit, netProfitEstimated: grossProfit }
  });

  return sale;
}

async function createReservationDemo(tx: Tx, skus: Record<string, number>) {
  const exists = await tx.reservation.findFirst({ where: { notes: { contains: `${DEMO} reserva pendiente` } } });
  if (exists) return exists;

  const phone = await tx.phoneUnit.findFirst({
    where: { productSkuId: skus.galaxy, status: "AVAILABLE" },
    orderBy: { id: "asc" }
  });
  if (!phone) throw new Error("No hay Galaxy disponible para la reserva demo");

  const reservationCode = await nextCode(tx, "reservation", "reservationCode", "RES");
  const reservation = await tx.reservation.create({
    data: {
      reservationCode,
      customerName: "Mariana Torres",
      customerPhone: "51944556677",
      customerDni: "76543210",
      shippingType: "LIMA",
      destinationDepartment: "Lima",
      destinationProvince: "Lima",
      destinationCity: "San Miguel",
      addressReference: "Av. La Marina 1200",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      totalEstimated: 2987,
      notes: `${DEMO} reserva pendiente desde tienda web`
    }
  });

  await tx.phoneUnit.update({ where: { id: phone.id }, data: { status: "RESERVED", currentReservationId: reservation.id } });
  await tx.reservationItem.create({
    data: {
      reservationId: reservation.id,
      productSkuId: skus.galaxy,
      phoneUnitId: phone.id,
      quantityRequested: 1,
      unitPrice: 2899
    }
  });
  await tx.reservationItem.create({
    data: {
      reservationId: reservation.id,
      productSkuId: skus.cubo,
      quantityRequested: 1,
      unitPrice: 69
    }
  });
  await tx.reservationItem.create({
    data: {
      reservationId: reservation.id,
      productSkuId: skus.mica,
      quantityRequested: 1,
      unitPrice: 19
    }
  });

  await tx.inventoryMovement.createMany({
    data: [
      {
        productSkuId: skus.galaxy,
        phoneUnitId: phone.id,
        movementType: "RESERVATION_HOLD",
        quantity: 1,
        unitCost: phone.unitPurchasePrice,
        referenceType: "RESERVATION",
        referenceId: reservation.id
      },
      {
        productSkuId: skus.cubo,
        movementType: "RESERVATION_HOLD",
        quantity: 1,
        unitCost: 0,
        referenceType: "RESERVATION",
        referenceId: reservation.id
      },
      {
        productSkuId: skus.mica,
        movementType: "RESERVATION_HOLD",
        quantity: 1,
        unitCost: 0,
        referenceType: "RESERVATION",
        referenceId: reservation.id
      }
    ]
  });

  const message = `Hola DIMENSITECH STORE, deseo consultar/reservar:\n\nProducto(s): Samsung Galaxy S24 x1, Cubo Apple 20W x1, Mica x1\nTotal estimado: S/ 2987.00\nTipo de entrega: LIMA\nDestino: San Miguel, Lima\nNombre: Mariana Torres\nCodigo de reserva: ${reservationCode}\n\nQuedo atento a la confirmacion.`;
  await tx.reservation.update({ where: { id: reservation.id }, data: { whatsappMessage: message } });
  await tx.notification.create({
    data: {
      type: "NEW_RESERVATION",
      title: "Nueva reserva demo",
      message: `Nueva reserva demo ${reservation.reservationCode} - Cliente: Mariana Torres`
    }
  });

  return reservation;
}

async function main() {
  await prisma.$transaction(async (tx) => {
    const admin = await tx.user.findFirst({ where: { role: "ADMIN" }, orderBy: { id: "asc" } });
    if (!admin) throw new Error("No existe usuario administrador. Ejecuta primero prisma/seed.ts.");

    const [phoneType, cubeType, cableType, caseType, micaType] = await Promise.all([
      tx.productType.findUniqueOrThrow({ where: { name: "Celular" } }),
      tx.productType.findUniqueOrThrow({ where: { name: "Cubo" } }),
      tx.productType.findUniqueOrThrow({ where: { name: "Cable" } }),
      tx.productType.findUniqueOrThrow({ where: { name: "Case" } }),
      tx.productType.findUniqueOrThrow({ where: { name: "Mica" } })
    ]);

    const provider = await ensureProvider(tx, {
      name: "TecnoImport Demo SAC",
      dniRuc: "20609999001",
      phone: "014445566",
      whatsapp: "51999888777",
      address: "Av. Wilson 1250",
      city: "Lima",
      observation: `${DEMO} proveedor mayorista`
    });

    await ensureProvider(tx, {
      name: "Accesorios Global Demo",
      dniRuc: "20609999002",
      phone: "014448899",
      whatsapp: "51988777666",
      address: "Jr. Paruro 950",
      city: "Lima",
      observation: `${DEMO} proveedor alternativo`
    });

    await ensureCustomer(tx, {
      dni: "45678901",
      firstNames: "Carlos",
      lastNames: "Ramos",
      phone: "51987654321",
      address: "Av. Javier Prado 2400",
      city: "Lima",
      observation: `${DEMO} cliente frecuente`
    });
    const customer = await ensureCustomer(tx, {
      dni: "12345678",
      firstNames: "Lucia",
      lastNames: "Vega",
      phone: "51912345678",
      address: "Calle Los Pinos 456",
      city: "Lima",
      observation: `${DEMO} cliente venta mostrador`
    });

    const customer2 = await ensureCustomer(tx, {
      dni: "56781234",
      firstNames: "Diego",
      lastNames: "Salazar",
      phone: "51933445566",
      address: "Av. Primavera 900",
      city: "Surco",
      observation: `${DEMO} cliente accesorios`
    });

    const images = {
      iphone: await ensureImage(tx, {
        productTypeId: phoneType.id,
        brand: "Apple",
        productName: "iPhone 15",
        commercialModel: "iPhone 15",
        platform: "IPHONE",
        color: "Negro",
        imageUrl: "https://dummyimage.com/900x900/f8fafc/111827.png&text=iPhone+15",
        imageHash: "demo-iphone-15-black",
        altText: "iPhone 15 negro"
      }),
      galaxy: await ensureImage(tx, {
        productTypeId: phoneType.id,
        brand: "Samsung",
        productName: "Galaxy S24",
        commercialModel: "Galaxy S24",
        platform: "ANDROID",
        color: "Gris",
        imageUrl: "https://dummyimage.com/900x900/f8fafc/111827.png&text=Galaxy+S24",
        imageHash: "demo-galaxy-s24-gray",
        altText: "Samsung Galaxy S24 gris"
      }),
      redmi: await ensureImage(tx, {
        productTypeId: phoneType.id,
        brand: "Xiaomi",
        productName: "Redmi Note 13",
        commercialModel: "Redmi Note 13",
        platform: "ANDROID",
        color: "Azul",
        imageUrl: "https://dummyimage.com/900x900/f8fafc/111827.png&text=Redmi+Note+13",
        imageHash: "demo-redmi-note-13-blue",
        altText: "Redmi Note 13 azul"
      }),
      cube: await ensureImage(tx, {
        productTypeId: cubeType.id,
        brand: "Apple",
        productName: "Cubo 20W USB-C",
        color: "Blanco",
        imageUrl: "https://dummyimage.com/900x900/f8fafc/111827.png&text=Cubo+20W",
        imageHash: "demo-cube-20w",
        altText: "Cubo cargador 20W"
      }),
      cable: await ensureImage(tx, {
        productTypeId: cableType.id,
        brand: "Generico",
        productName: "Cable USB-C",
        color: "Blanco",
        imageUrl: "https://dummyimage.com/900x900/f8fafc/111827.png&text=Cable+USB-C",
        imageHash: "demo-cable-usbc",
        altText: "Cable USB-C"
      }),
      caseIphone: await ensureImage(tx, {
        productTypeId: caseType.id,
        brand: "Generico",
        productName: "Case iPhone 15",
        color: "Transparente",
        imageUrl: "https://dummyimage.com/900x900/f8fafc/111827.png&text=Case+iPhone+15",
        imageHash: "demo-case-iphone-15",
        altText: "Case transparente para iPhone 15"
      }),
      mica: await ensureImage(tx, {
        productTypeId: micaType.id,
        brand: "Generico",
        productName: "Mica 9D",
        color: "Transparente",
        imageUrl: "https://dummyimage.com/900x900/f8fafc/111827.png&text=Mica+9D",
        imageHash: "demo-mica-9d",
        altText: "Mica de vidrio templado"
      })
    };

    const skus = {
      iphone: (await ensureSku(tx, {
        skuCode: "DEMO-IPH15-128-BLK",
        productTypeId: phoneType.id,
        imageId: images.iphone.id,
        brand: "Apple",
        name: "iPhone 15",
        commercialModel: "iPhone 15",
        platform: "IPHONE",
        color: "Negro",
        storage: "128GB",
        ram: "6GB",
        modelNumber: "A3090",
        shortDescription: "Equipo nuevo sellado, liberado, con IMEI validado.",
        suggestedSalePrice: 3199,
        visibleInStore: true,
        minStock: 1
      })).id,
      galaxy: (await ensureSku(tx, {
        skuCode: "DEMO-S24-256-GRY",
        productTypeId: phoneType.id,
        imageId: images.galaxy.id,
        brand: "Samsung",
        name: "Galaxy S24",
        commercialModel: "Galaxy S24",
        platform: "ANDROID",
        color: "Gris",
        storage: "256GB",
        ram: "8GB",
        modelNumber: "SM-S921B",
        shortDescription: "Android gama alta con stock por unidad fisica.",
        suggestedSalePrice: 2899,
        visibleInStore: true,
        minStock: 1
      })).id,
      redmi: (await ensureSku(tx, {
        skuCode: "DEMO-REDMI13-256-BLU",
        productTypeId: phoneType.id,
        imageId: images.redmi.id,
        brand: "Xiaomi",
        name: "Redmi Note 13",
        commercialModel: "Redmi Note 13",
        platform: "ANDROID",
        color: "Azul",
        storage: "256GB",
        ram: "8GB",
        modelNumber: "23129RAA4G",
        shortDescription: "Equipo Android con excelente rotacion para tienda.",
        suggestedSalePrice: 899,
        visibleInStore: true,
        minStock: 2
      })).id,
      cubo: (await ensureSku(tx, {
        skuCode: "DEMO-CUBO-20W-WHT",
        productTypeId: cubeType.id,
        imageId: images.cube.id,
        brand: "Apple",
        name: "Cubo 20W USB-C",
        commercialModel: "20W USB-C",
        color: "Blanco",
        shortDescription: "Cargador compatible con iPhone y Android USB-C.",
        suggestedSalePrice: 69,
        visibleInStore: true,
        minStock: 5
      })).id,
      cable: (await ensureSku(tx, {
        skuCode: "DEMO-CABLE-USBC-1M",
        productTypeId: cableType.id,
        imageId: images.cable.id,
        brand: "Generico",
        name: "Cable USB-C a USB-C 1m",
        commercialModel: "USB-C 1m",
        color: "Blanco",
        shortDescription: "Cable de carga rapida para accesorios y celulares.",
        suggestedSalePrice: 39,
        visibleInStore: true,
        minStock: 8
      })).id,
      caseIphone: (await ensureSku(tx, {
        skuCode: "DEMO-CASE-IP15-CLR",
        productTypeId: caseType.id,
        imageId: images.caseIphone.id,
        brand: "Generico",
        name: "Case transparente iPhone 15",
        commercialModel: "iPhone 15",
        color: "Transparente",
        shortDescription: "Case flexible transparente compatible con iPhone 15.",
        suggestedSalePrice: 49,
        visibleInStore: true,
        minStock: 5
      })).id,
      mica: (await ensureSku(tx, {
        skuCode: "DEMO-MICA-9D-UNIV",
        productTypeId: micaType.id,
        imageId: images.mica.id,
        brand: "Generico",
        name: "Mica vidrio templado 9D",
        commercialModel: "Universal",
        color: "Transparente",
        shortDescription: "Mica de vidrio templado para venta cruzada.",
        suggestedSalePrice: 29,
        visibleInStore: true,
        minStock: 10
      })).id
    };

    await createPurchaseDemo(tx, admin.id, provider.id, skus);
    await createSaleDemo(tx, admin.id, customer.id, skus);
    await createAccessorySaleDemo(tx, admin.id, customer2.id, skus);
    await createReservationDemo(tx, skus);

    const demoExpense = await tx.expense.findFirst({ where: { concept: `${DEMO} movilidad recojo de mercaderia` } });
    if (!demoExpense) {
      await tx.expense.create({
        data: {
        expenseDate: new Date("2026-07-07T09:00:00-05:00"),
        concept: `${DEMO} movilidad recojo de mercaderia`,
        category: "Logistica",
        amount: 35,
        notes: "Gasto operativo de prueba"
        }
      });
    }

    const readyNotification = await tx.notification.findFirst({
      where: { title: "Demo lista", message: "Datos de prueba cargados: productos, compra, venta, reserva, stock y reportes." }
    });
    if (!readyNotification) {
      await tx.notification.create({
        data: {
          type: "LOW_ACCESSORY_STOCK",
          title: "Demo lista",
          message: "Datos de prueba cargados: productos, compra, venta, reserva, stock y reportes.",
          userId: admin.id
        }
      });
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Datos demo cargados correctamente.");
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
