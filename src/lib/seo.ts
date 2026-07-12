export const siteName = "DimensiTech Store";
export const siteTitle = "DimensiTech Store | Celulares y accesorios en Peru";
export const siteDescription =
  "Compra celulares iPhone, Android y accesorios tecnologicos en DimensiTech Store. Stock verificado, precios online y envios a Lima, Huaraz y todo el Peru.";

export function siteUrl() {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function absoluteUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${siteUrl()}${normalizedPath}`;
}

export function logoUrl() {
  return absoluteUrl("/uploads/logo/logo.jpg");
}

export function productTitle(parts: Array<string | null | undefined>) {
  return parts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

export function productDescription({
  brand,
  name,
  color,
  storage,
  description
}: {
  brand: string;
  name: string;
  color?: string | null;
  storage?: string | null;
  description?: string | null;
}) {
  return (
    description ||
    `Compra ${productTitle([brand, name, storage, color])} en DimensiTech Store. Consulta stock, precio online, garantia y envio a todo el Peru.`
  );
}

export function jsonLdScript(data: unknown) {
  return {
    __html: JSON.stringify(data).replace(/</g, "\\u003c")
  };
}
