import type { MetadataRoute } from "next";
import { absoluteUrl, siteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/tienda", "/tienda/producto/"],
        disallow: ["/admin", "/api", "/login", "/cambiar-contrasena"]
      }
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: siteUrl()
  };
}
