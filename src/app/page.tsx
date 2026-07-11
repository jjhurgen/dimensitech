import type { Metadata } from "next";
import { StorefrontPage } from "@/components/store/storefront-page";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "DimensiTech | Celulares y accesorios",
  description: "Compra celulares iPhone, Android y accesorios tecnologicos en DIMENSITECH STORE. Consulta stock, precios y arma tu carrito."
};

export default async function HomePage({ searchParams }: { searchParams?: Promise<Record<string, string>> }) {
  return <StorefrontPage searchParams={searchParams} basePath="/" />;
}
