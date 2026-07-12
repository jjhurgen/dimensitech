import type { Metadata } from "next";
import { StorefrontPage } from "@/components/store/storefront-page";
import { absoluteUrl, logoUrl, siteDescription, siteTitle } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: siteTitle,
  description: siteDescription,
  alternates: { canonical: "/tienda" },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: absoluteUrl("/tienda"),
    images: [{ url: logoUrl(), width: 1200, height: 630, alt: "DimensiTech Store" }]
  }
};

export default async function HomePage({ searchParams }: { searchParams?: Promise<Record<string, string>> }) {
  return <StorefrontPage searchParams={searchParams} basePath="/" />;
}
