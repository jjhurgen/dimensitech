import { Prisma, ProductCondition } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { activePromotionsForProducts } from "@/lib/promotions";
import { productConditionLabel } from "@/lib/product-condition";
import { expireReservations, productWebStock } from "@/lib/services/reservations";

export type StoreProduct = {
  id: number;
  slug: string;
  skuCode: string;
  brand: string;
  name: string;
  commercialModel: string | null;
  productType: string;
  isPhone: boolean;
  platform: string | null;
  color: string | null;
  storage: string | null;
  ram: string | null;
  condition: string;
  conditionLabel: string;
  description: string | null;
  price: number;
  oldPrice: number | null;
  discountBadge: string | null;
  discountBadgeColor: string | null;
  discountName: string | null;
  discountAmount: number | null;
  imageUrl: string | null;
  imageAlt: string | null;
  stock: number;
  availableOnRequest: boolean;
  requestDeliveryDays: number | null;
  isRequestOnly: boolean;
  statusLabel: string;
  badge: string;
  isValidated: boolean;
  updatedAt: string;
  colorVariants: StoreProductColorVariant[];
};

export type StoreProductColorVariant = {
  id: number;
  slug: string;
  color: string | null;
  price: number;
  stock: number;
  isRequestOnly: boolean;
};

export type StoreFilters = {
  search?: string;
  categoria?: string;
  tipo?: string;
  campana?: string;
  marca?: string;
  plataforma?: string;
  modelo?: string;
  almacenamiento?: string;
  ram?: string;
  color?: string;
  condicion?: string;
  disponibilidad?: string;
  compatibilidad?: string;
  reserva?: string;
  min?: string;
  max?: string;
  sort?: string;
};

export type StoreCampaignFilterOption = {
  id: number;
  name: string;
};

const categoryTypeMap: Record<string, string[]> = {
  celulares: ["Celular"],
  accesorios: ["Cubo", "Cable", "Case", "Mica", "Audifono", "Cargador", "Otro"],
  cases: ["Case"],
  cubos: ["Cubo"],
  cables: ["Cable"],
  micas: ["Mica"]
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function productSlug(product: Pick<StoreProduct, "id" | "brand" | "name" | "color" | "storage">) {
  return `${product.id}-${slugify([product.brand, product.name, product.color, product.storage].filter(Boolean).join(" "))}`;
}

export function parseProductId(slug: string) {
  return Number(slug.split("-")[0]);
}

export function titleForFilters(filters: StoreFilters) {
  const brand = filters.marca ? capitalize(filters.marca) : "";
  if (filters.campana) return "Productos en campana";
  if (filters.tipo === "case") return brand ? `Cases para ${brand}` : "Cases disponibles";
  if (filters.categoria === "accesorios") return "Accesorios disponibles";
  if (filters.categoria === "celulares" || filters.plataforma) {
    if (filters.plataforma === "IPHONE" || filters.marca === "apple") return "Celulares iPhone";
    if (brand) return `Celulares ${brand}`;
    return "Celulares disponibles";
  }
  return "Celulares y accesorios";
}

export function activeFilterChips(filters: StoreFilters, campaigns: StoreCampaignFilterOption[] = []) {
  const campaignLabels = new Map(campaigns.map((campaign) => [String(campaign.id), campaign.name]));

  return Object.entries(filters)
    .filter(([key, value]) => value && !["sort", "page"].includes(key))
    .map(([key, value]) => ({
      key,
      label: key === "min" || key === "max"
        ? `S/ ${value}`
        : key === "campana"
          ? campaignLabels.get(String(value)) ?? `Campana ${value}`
        : key === "condicion"
          ? productConditionLabel(String(value))
          : capitalize(String(value))
    }));
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function conditionFilter(value?: string): ProductCondition | undefined {
  return value && ["NEW_SEALED", "REFURBISHED", "OPEN_BOX", "USED"].includes(value) ? value as ProductCondition : undefined;
}

function productGroupKey(product: StoreProduct) {
  return [
    product.productType,
    product.brand,
    product.commercialModel || product.name,
    product.storage || "",
    product.ram || "",
    product.condition,
    product.platform || ""
  ].map((value) => value.toLowerCase().trim()).join("|");
}

function groupProductsByColor(products: StoreProduct[]) {
  const groups = new Map<string, StoreProduct[]>();
  const order: string[] = [];

  for (const product of products) {
    const key = productGroupKey(product);
    if (!groups.has(key)) {
      groups.set(key, []);
      order.push(key);
    }
    groups.get(key)!.push(product);
  }

  return order.map((key) => {
    const group = groups.get(key)!;
    const representative = group[0];
    const variants = group
      .map((product) => ({
        id: product.id,
        slug: product.slug,
        color: product.color,
        price: product.price,
        stock: product.stock,
        isRequestOnly: product.isRequestOnly
      }))
      .sort((a, b) => {
        if (a.id === representative.id) return -1;
        if (b.id === representative.id) return 1;
        return (a.color ?? "").localeCompare(b.color ?? "", "es");
      });

    return { ...representative, colorVariants: variants };
  });
}

export async function getStoreProducts(filters: StoreFilters) {
  await expireReservations();

  const search = filters.search ?? "";
  const min = Number(filters.min || 0);
  const max = Number(filters.max || 0);
  const campaignId = Number(filters.campana || 0);
  const now = new Date();
  const typeNames = filters.tipo
    ? categoryTypeMap[`${filters.tipo}s`] ?? [capitalize(filters.tipo)]
    : filters.categoria
      ? categoryTypeMap[filters.categoria] ?? undefined
      : undefined;

  const where: Prisma.ProductSkuWhereInput = {
    visibleInStore: true,
    status: "ACTIVE",
    productType: typeNames ? { name: { in: typeNames } } : undefined,
    discountProducts: campaignId
      ? { some: { campaign: { id: campaignId, isActive: true, startsAt: { lte: now }, endsAt: { gte: now } } } }
      : undefined,
    brand: filters.marca ? { contains: filters.marca } : undefined,
    platform: filters.plataforma === "IPHONE" || filters.plataforma === "ANDROID" ? filters.plataforma : undefined,
    commercialModel: filters.modelo ? { contains: filters.modelo } : undefined,
    storage: filters.almacenamiento ? { contains: filters.almacenamiento } : undefined,
    ram: filters.ram ? { contains: filters.ram } : undefined,
    color: filters.color ? { contains: filters.color } : undefined,
    condition: conditionFilter(filters.condicion),
    suggestedSalePrice: max
      ? { gte: min, lte: max }
      : min
        ? { gte: min }
        : undefined,
    OR: search
      ? [
          { name: { contains: search } },
          { brand: { contains: search } },
          { commercialModel: { contains: search } },
          { color: { contains: search } },
          { storage: { contains: search } },
          { productType: { name: { contains: search } } }
        ]
      : undefined
  };

  const rows = await prisma.productSku.findMany({
    where,
    include: { productType: true, image: true },
    orderBy: filters.sort === "recientes" ? { updatedAt: "desc" } : { id: "desc" },
    take: 120
  });
  const promotions = await activePromotionsForProducts(rows.map((row) => row.id));

  const products = await Promise.all(
    rows.map(async (row) => {
      const stock = await productWebStock(row.id);
      const basePrice = Number(row.suggestedSalePrice);
      const promotion = promotions.get(row.id);
      const price = promotion?.finalPrice ?? basePrice;
      const isPhone = row.productType.requiresImei;
      const isRequestOnly = stock <= 0 && row.availableOnRequest;
      const requestLabel = row.requestDeliveryDays
        ? `Llega en ${row.requestDeliveryDays} dia${row.requestDeliveryDays === 1 ? "" : "s"}`
        : "A pedido";
      const product: StoreProduct = {
        id: row.id,
        slug: "",
        skuCode: row.skuCode,
        brand: row.brand,
        name: row.name,
        commercialModel: row.commercialModel,
        productType: row.productType.name,
        isPhone,
        platform: row.platform,
        color: row.color,
        storage: row.storage,
        ram: row.ram,
        condition: row.condition,
        conditionLabel: productConditionLabel(row.condition),
        description: row.shortDescription,
        price,
        oldPrice: promotion ? basePrice : null,
        discountBadge: promotion?.badgeLabel ?? null,
        discountBadgeColor: promotion?.badgeColor ?? null,
        discountName: promotion?.campaignName ?? null,
        discountAmount: promotion?.discountAmount ?? null,
        imageUrl: row.image?.imageUrl ?? null,
        imageAlt: row.image?.altText ?? null,
        stock,
        availableOnRequest: row.availableOnRequest,
        requestDeliveryDays: row.requestDeliveryDays,
        isRequestOnly,
        statusLabel: isRequestOnly ? requestLabel : stock <= 0 ? "Sin stock" : stock <= 2 ? "Ultimas unidades" : "Disponible",
        badge: isRequestOnly ? "A pedido" : stock <= 0 ? "Sin stock" : stock <= 2 ? "Ultimas unidades" : isPhone ? "Nuevo" : "Stock real",
        isValidated: isPhone && stock > 0,
        updatedAt: row.updatedAt.toISOString(),
        colorVariants: []
      };
      product.slug = productSlug(product);
      return product;
    })
  );

  const availability = filters.disponibilidad;
  const filtered = products.filter((product) => {
    if (availability === "disponible") return product.stock > 2;
    if (availability === "ultimas") return product.stock > 0 && product.stock <= 2;
    if (availability === "a-pedido") return product.isRequestOnly;
    if (availability === "sin-stock") return product.stock <= 0 && !product.isRequestOnly;
    return true;
  });

  const sorted = filtered.sort((a, b) => {
    if (filters.sort === "menor-precio") return a.price - b.price;
    if (filters.sort === "mayor-precio") return b.price - a.price;
    if (filters.sort === "mayor-stock") return b.stock - a.stock;
    if (filters.sort === "ultimas") return (a.stock || 999) - (b.stock || 999);
    return 0;
  });

  return groupProductsByColor(sorted);
}

export async function getFeaturedStoreProducts(products: StoreProduct[]) {
  return products.filter((product) => product.stock > 0).slice(0, 10);
}

export async function getStoreCampaignFilters(): Promise<StoreCampaignFilterOption[]> {
  const now = new Date();
  return prisma.discountCampaign.findMany({
    where: {
      isActive: true,
      startsAt: { lte: now },
      endsAt: { gte: now },
      products: { some: {} }
    },
    select: { id: true, name: true },
    orderBy: [{ startsAt: "desc" }, { id: "desc" }]
  });
}
