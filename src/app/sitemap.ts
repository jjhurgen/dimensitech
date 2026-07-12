import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/seo";
import { productSlug } from "@/lib/storefront";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await prisma.productSku.findMany({
    where: { visibleInStore: true, status: "ACTIVE" },
    select: { id: true, brand: true, name: true, color: true, storage: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: 5000
  });

  return [
    {
      url: absoluteUrl("/tienda"),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1
    },
    ...products.map((product) => ({
      url: absoluteUrl(`/tienda/producto/${productSlug(product)}`),
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8
    }))
  ];
}
