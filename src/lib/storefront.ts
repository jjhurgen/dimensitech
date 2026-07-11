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
};

export type StoreFilters = {
  search?: string;
  categoria?: string;
  tipo?: string;
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
  if (filters.tipo === "case") return brand ? `Cases para ${brand}` : "Cases disponibles";
  if (filters.categoria === "accesorios") return "Accesorios disponibles";
  if (filters.categoria === "celulares" || filters.plataforma) {
    if (filters.plataforma === "IPHONE" || filters.marca === "apple") return "Celulares iPhone";
    if (brand) return `Celulares ${brand}`;
    return "Celulares disponibles";
  }
  return "Celulares y accesorios";
}

export function activeFilterChips(filters: StoreFilters) {
  return Object.entries(filters)
    .filter(([key, value]) => value && !["sort", "page"].includes(key))
    .map(([key, value]) => ({
      key,
      label: key === "min" || key === "max"
        ? `S/ ${value}`
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

export async function getStoreProducts(filters: StoreFilters) {
  await expireReservations();

  const search = filters.search ?? "";
  const min = Number(filters.min || 0);
  const max = Number(filters.max || 0);
  const typeNames = filters.tipo
    ? categoryTypeMap[`${filters.tipo}s`] ?? [capitalize(filters.tipo)]
    : filters.categoria
      ? categoryTypeMap[filters.categoria] ?? undefined
      : undefined;

  const where: Prisma.ProductSkuWhereInput = {
    visibleInStore: true,
    status: "ACTIVE",
    productType: typeNames ? { name: { in: typeNames } } : undefined,
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
        updatedAt: row.updatedAt.toISOString()
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

  return filtered.sort((a, b) => {
    if (filters.sort === "menor-precio") return a.price - b.price;
    if (filters.sort === "mayor-precio") return b.price - a.price;
    if (filters.sort === "mayor-stock") return b.stock - a.stock;
    if (filters.sort === "ultimas") return (a.stock || 999) - (b.stock || 999);
    return 0;
  });
}

export async function getFeaturedStoreProducts(products: StoreProduct[]) {
  return products.filter((product) => product.stock > 0).slice(0, 10);
}
