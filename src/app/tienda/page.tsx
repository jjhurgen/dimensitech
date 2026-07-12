import type { Metadata } from "next";
import { StorefrontPage } from "@/components/store/storefront-page";
import { absoluteUrl, jsonLdScript, logoUrl, siteDescription, siteName, siteTitle } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: siteTitle,
  description: siteDescription,
  alternates: { canonical: "/tienda" },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: absoluteUrl("/tienda"),
    images: [{ url: logoUrl(), width: 1200, height: 630, alt: siteName }]
  }
};

export default async function StorePage({ searchParams }: { searchParams?: Promise<Record<string, string>> }) {
  const storeJsonLd = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: siteName,
    url: absoluteUrl("/tienda"),
    logo: logoUrl(),
    image: logoUrl(),
    description: siteDescription,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Huaraz",
      addressRegion: "Ancash",
      addressCountry: "PE"
    },
    areaServed: ["Peru", "Lima", "Huaraz", "Ancash"],
    sameAs: [
      process.env.NEXT_PUBLIC_FACEBOOK_URL ?? "https://www.facebook.com/profile.php?id=61556826736209",
      process.env.NEXT_PUBLIC_TIKTOK_URL ?? "https://www.tiktok.com/@dimensitech7"
    ]
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(storeJsonLd)} />
      <StorefrontPage searchParams={searchParams} />
    </>
  );
}
