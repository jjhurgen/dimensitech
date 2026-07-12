import type { Metadata } from "next";
import { absoluteUrl, logoUrl, siteDescription, siteName, siteTitle, siteUrl } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  applicationName: siteName,
  title: {
    default: siteTitle,
    template: `%s | ${siteName}`
  },
  description: siteDescription,
  alternates: {
    canonical: "/tienda"
  },
  openGraph: {
    type: "website",
    locale: "es_PE",
    siteName,
    title: siteTitle,
    description: siteDescription,
    url: absoluteUrl("/tienda"),
    images: [{ url: logoUrl(), width: 1200, height: 630, alt: siteName }]
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: [logoUrl()]
  },
  icons: {
    icon: "/uploads/logo/icono.ico",
    shortcut: "/uploads/logo/icono.ico"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
