import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { activePromotionsForProducts } from "@/lib/promotions";
import { createReservation } from "@/lib/services/reservations";

type CartOrderBody = {
  customerName?: string;
  customerPhone?: string;
  customerDni?: string;
  shippingType?: "LIMA" | "PROVINCE" | "STORE_PICKUP" | "DELIVERY";
  destinationDepartment?: string;
  destinationProvince?: string;
  destinationCity?: string;
  addressReference?: string;
  notes?: string;
  items?: Array<{ productSkuId?: number; quantityRequested?: number }>;
};

type RateEntry = { count: number; resetAt: number };

const rateStore = globalThis as typeof globalThis & {
  cartOrderRateLimit?: Map<string, RateEntry>;
};

const rateLimit = rateStore.cartOrderRateLimit ?? new Map<string, RateEntry>();
rateStore.cartOrderRateLimit = rateLimit;

function clientIp(requestHeaders: Headers) {
  return (
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip") ||
    requestHeaders.get("cf-connecting-ip") ||
    "local"
  );
}

function normalizePhone(value?: string) {
  return String(value ?? "").replace(/[^\d+]/g, "").slice(0, 20);
}

function cleanText(value: unknown, maxLength: number) {
  const text = String(value ?? "").trim().replace(/\s+/g, " ");
  return text.slice(0, maxLength) || undefined;
}

function assertRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = rateLimit.get(key);
  if (!current || current.resetAt <= now) {
    rateLimit.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  if (current.count >= limit) {
    const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    throw Object.assign(new Error("Demasiadas solicitudes. Intenta nuevamente en unos minutos."), { retryAfter });
  }
  current.count += 1;
}

function reservationFingerprint(items: Array<{ productSkuId: number; quantityRequested: number }>) {
  return items
    .map((item) => `${item.productSkuId}:${item.quantityRequested}`)
    .sort()
    .join("|");
}

export async function POST(request: Request) {
  try {
    const requestHeaders = await headers();
    const body = (await request.json()) as CartOrderBody;
    const items = Array.isArray(body.items) ? body.items : [];
    const customerName = cleanText(body.customerName, 80);
    const customerPhone = normalizePhone(body.customerPhone);
    const customerDni = cleanText(body.customerDni, 20);

    assertRateLimit(`ip:${clientIp(requestHeaders)}`, 8, 10 * 60 * 1000);
    if (customerPhone) assertRateLimit(`phone:${customerPhone}`, 4, 10 * 60 * 1000);

    if (!customerName || customerName.length < 2) {
      return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
    }
    if (!customerPhone || customerPhone.length < 6) {
      return NextResponse.json({ error: "WhatsApp requerido" }, { status: 400 });
    }
    if (!items.length) {
      return NextResponse.json({ error: "El carrito esta vacio" }, { status: 400 });
    }

    const requestedItems = items.map((item) => ({
      productSkuId: Number(item.productSkuId),
      quantityRequested: Math.min(Math.max(1, Number(item.quantityRequested ?? 1)), 10)
    })).filter((item) => item.productSkuId > 0);
    if (!requestedItems.length) {
      return NextResponse.json({ error: "El carrito esta vacio" }, { status: 400 });
    }
    if (requestedItems.length > 20) {
      return NextResponse.json({ error: "Demasiados productos en un solo pedido" }, { status: 400 });
    }

    const ids = requestedItems.map((item) => item.productSkuId);
    const products = await prisma.productSku.findMany({ where: { id: { in: ids }, status: "ACTIVE" } });
    const productById = new Map(products.map((product) => [product.id, product]));
    const promotions = await activePromotionsForProducts(ids);
    const reservationItems = requestedItems.map((item) => {
      const productSkuId = item.productSkuId;
      const product = productById.get(productSkuId);
      if (!product) throw new Error("Producto no disponible");
      const promotion = promotions.get(productSkuId);
      return {
        productSkuId,
        quantityRequested: item.quantityRequested,
        unitPrice: promotion?.finalPrice ?? Number(product.suggestedSalePrice),
        originalUnitPrice: Number(product.suggestedSalePrice),
        discountUnitAmount: promotion?.discountAmount ?? 0,
        discountLabel: promotion?.badgeLabel,
        discountCampaignName: promotion?.campaignName
      };
    });

    const duplicateCutoff = new Date(Date.now() - 10 * 60 * 1000);
    const existingReservations = await prisma.reservation.findMany({
      where: { status: "PENDING", customerPhone, createdAt: { gte: duplicateCutoff } },
      include: { items: true },
      orderBy: { id: "desc" },
      take: 5
    });
    const currentFingerprint = reservationFingerprint(reservationItems);
    const duplicate = existingReservations.find((reservation) => reservationFingerprint(reservation.items.map((item) => ({
      productSkuId: item.productSkuId,
      quantityRequested: item.quantityRequested
    }))) === currentFingerprint);
    if (duplicate) {
      return NextResponse.json({
        reservationCode: duplicate.reservationCode,
        whatsappMessage: duplicate.whatsappMessage,
        whatsappUrl: `https://wa.me/${process.env.WHATSAPP_STORE_PHONE ?? process.env.NEXT_PUBLIC_WHATSAPP_STORE_PHONE ?? "51999999999"}?text=${encodeURIComponent(duplicate.whatsappMessage ?? "")}`,
        reused: true
      });
    }

    const shippingType = body.shippingType || "STORE_PICKUP";
    const destinationDepartment = shippingType === "PROVINCE" ? cleanText(body.destinationDepartment, 60) : undefined;
    const destinationProvince = shippingType === "PROVINCE" ? cleanText(body.destinationProvince, 60) : undefined;
    const destinationCity = shippingType === "LIMA" || shippingType === "PROVINCE" ? cleanText(body.destinationCity, 60) : undefined;
    const addressReference = shippingType === "LIMA" || shippingType === "PROVINCE" || shippingType === "DELIVERY" ? cleanText(body.addressReference, 180) : undefined;

    const reservation = await createReservation({
      customerName,
      customerPhone,
      customerDni,
      shippingType,
      destinationDepartment,
      destinationProvince,
      destinationCity,
      addressReference,
      notes: `Pedido web por carrito. ${cleanText(body.notes, 240) || ""}`.trim(),
      items: reservationItems
    });

    return NextResponse.json({
      reservationCode: reservation.reservationCode,
      whatsappMessage: reservation.whatsappMessage,
      whatsappUrl: `https://wa.me/${process.env.WHATSAPP_STORE_PHONE ?? process.env.NEXT_PUBLIC_WHATSAPP_STORE_PHONE ?? "51999999999"}?text=${encodeURIComponent(reservation.whatsappMessage ?? "")}`
    });
  } catch (error) {
    const retryAfter = typeof error === "object" && error && "retryAfter" in error ? Number((error as { retryAfter: number }).retryAfter) : undefined;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo crear el pedido" },
      { status: retryAfter ? 429 : 400, headers: retryAfter ? { "Retry-After": String(retryAfter) } : undefined }
    );
  }
}
