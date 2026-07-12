import type { Metadata } from "next";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { MessageCircle, ShieldCheck, ShoppingCart, Truck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { AddToCartButton } from "@/components/store/add-to-cart-button";
import { ProductGrid } from "@/components/store/product-grid";
import { StoreCategoryBar } from "@/components/store/store-category-bar";
import { StoreHeader } from "@/components/store/store-header";
import { StoreBreadcrumb } from "@/components/store/store-breadcrumb";
import { discountBadgeClass } from "@/lib/discount-badge-colors";
import { productConditionLabel } from "@/lib/product-condition";
import { prisma } from "@/lib/prisma";
import { money } from "@/lib/utils";
import { parseProductId, productSlug, getStoreProducts } from "@/lib/storefront";
import { expireReservations, productWebStock } from "@/lib/services/reservations";
import { activePromotionForProduct } from "@/lib/promotions";
import { absoluteUrl, jsonLdScript, productDescription, productTitle, siteName } from "@/lib/seo";

export const dynamic = "force-dynamic";

const paymentMethods = [
  { src: "/uploads/payments/visa_logo.png", alt: "Visa" },
  { src: "/uploads/payments/mastercard_logo.png", alt: "Mastercard" },
  { src: "/uploads/payments/yape_logo.png", alt: "Yape" },
  { src: "/uploads/payments/plin_logo.png", alt: "Plin" },
  { src: "/uploads/payments/transferencia_logo.png", alt: "Transferencia bancaria" },
  { src: "/uploads/payments/mercado_logo.png", alt: "Mercado Pago" }
];

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const id = parseProductId(slug);
  const product = id ? await prisma.productSku.findUnique({ where: { id }, include: { image: true } }) : null;
  const title = product ? productTitle([product.brand, product.name, product.storage, product.color]) : "Celulares y accesorios";
  const canonical = product
    ? `/tienda/producto/${productSlug({
        id: product.id,
        brand: product.brand,
        name: product.name,
        color: product.color,
        storage: product.storage
      })}`
    : "/tienda";
  const description = product
    ? productDescription({
        brand: product.brand,
        name: product.name,
        color: product.color,
        storage: product.storage,
        description: product.shortDescription
      })
    : "Consulta stock, precio y compra productos tecnologicos en DimensiTech Store.";
  const image = product?.image?.imageUrl ? absoluteUrl(product.image.imageUrl) : undefined;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title: `${title} | ${siteName}`,
      description,
      url: absoluteUrl(canonical),
      images: image ? [{ url: image, alt: title }] : undefined
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined
    }
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  await expireReservations();

  const { slug } = await params;
  const id = parseProductId(slug);
  const product = await prisma.productSku.findUnique({
    where: { id },
    include: { productType: true, image: true, images: true }
  });
  if (!product) notFound();

  const [stock, promotion] = await Promise.all([
    productWebStock(product.id),
    activePromotionForProduct(product.id)
  ]);
  const basePrice = Number(product.suggestedSalePrice);
  const displayPrice = promotion?.finalPrice ?? basePrice;
  const requestOnly = stock <= 0 && product.availableOnRequest;
  const requestLabel = product.requestDeliveryDays
    ? `Llega en ${product.requestDeliveryDays} dia${product.requestDeliveryDays === 1 ? "" : "s"}`
    : "A pedido";
  const detailSlug = productSlug({
    id: product.id,
    brand: product.brand,
    name: product.name,
    color: product.color,
    storage: product.storage
  });
  if (slug !== detailSlug) redirect(`/tienda/producto/${detailSlug}`);

  const productName = productTitle([product.brand, product.name, product.storage, product.color]);
  const canonicalUrl = absoluteUrl(`/tienda/producto/${detailSlug}`);
  const productImage = product.image?.imageUrl ? absoluteUrl(product.image.imageUrl) : undefined;
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: productName,
    description: productDescription({
      brand: product.brand,
      name: product.name,
      color: product.color,
      storage: product.storage,
      description: product.shortDescription
    }),
    image: productImage ? [productImage] : undefined,
    sku: product.skuCode,
    brand: {
      "@type": "Brand",
      name: product.brand
    },
    url: canonicalUrl,
    offers: {
      "@type": "Offer",
      url: canonicalUrl,
      priceCurrency: "PEN",
      price: displayPrice.toFixed(2),
      availability: stock > 0 || requestOnly ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition:
        product.condition === "USED"
          ? "https://schema.org/UsedCondition"
          : product.condition === "REFURBISHED"
            ? "https://schema.org/RefurbishedCondition"
            : "https://schema.org/NewCondition"
    }
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Tienda", item: absoluteUrl("/tienda") },
      { "@type": "ListItem", position: 2, name: product.productType.name, item: absoluteUrl(`/tienda?tipo=${encodeURIComponent(product.productType.name.toLowerCase())}`) },
      { "@type": "ListItem", position: 3, name: productName, item: canonicalUrl }
    ]
  };
  const related = (await getStoreProducts({ marca: product.brand })).filter((item) => item.id !== product.id).slice(0, 4);
  const phone = process.env.WHATSAPP_STORE_PHONE ?? "51999999999";
  const message = encodeURIComponent(`Hola DIMENSITECH STORE, deseo consultar este producto:

Producto: ${product.brand} ${product.name} ${product.storage ?? ""} ${product.color ?? ""}
Cantidad: 1
Precio: ${money(displayPrice)}
${promotion ? `Promocion: ${promotion.badgeLabel} - ${promotion.campaignName}` : ""}

Quedo atento a la informacion.`);
  const cartItem = {
    id: product.id,
    slug: detailSlug,
    brand: product.brand,
    name: product.name,
    price: displayPrice,
    oldPrice: promotion ? basePrice : null,
    discountBadge: promotion?.badgeLabel ?? null,
    discountBadgeColor: promotion?.badgeColor ?? null,
    discountName: promotion?.campaignName ?? null,
    discountAmount: promotion?.discountAmount ?? null,
    imageUrl: product.image?.imageUrl ?? null,
    color: product.color,
    storage: product.storage,
    ram: product.ram,
    stock
  };

  return (
    <main className="min-h-screen bg-[#f6f7f9]">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(productJsonLd)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(breadcrumbJsonLd)} />
      <StoreHeader />
      <StoreCategoryBar />
      <div className="mx-auto max-w-7xl space-y-4 px-4 py-4">
        <StoreBreadcrumb current={product.name} />
        <Card className="grid gap-6 rounded-lg border-slate-200 p-4 shadow-sm md:grid-cols-[1.05fr_0.95fr] md:p-5">
          <section className="space-y-3">
            <div className="relative aspect-square overflow-hidden rounded-lg border border-slate-100 bg-white">
              {product.image?.imageUrl ? (
                <Image src={product.image.imageUrl} alt={product.image.altText ?? product.name} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-contain p-8" priority />
              ) : (
                <div className="grid h-full place-items-center text-center text-lg font-black text-slate-500">DIMENSITECH STORE<br /><span className="text-sm font-medium">Imagen referencial no disponible</span></div>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[product.image?.imageUrl, ...product.images.map((image) => image.imageUrl)].filter(Boolean).slice(0, 4).map((url, index) => (
                <div key={`${url}-${index}`} className="relative aspect-square overflow-hidden rounded-md border border-slate-200 bg-white">
                  <Image src={url!} alt={product.name} fill sizes="(min-width: 768px) 12vw, 25vw" className="object-contain p-2" />
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400">Imagen referencial. No representa necesariamente la foto real de la unidad fisica vendida.</p>
          </section>

          <section>
            <p className="text-xs font-black uppercase text-slate-500">{product.brand}</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">{product.name}</h1>
            <p className="mt-2 text-sm font-medium text-slate-500">{product.color} {product.storage} {product.ram}</p>
            <div className="mt-5 border-y border-slate-100 py-4">
              <p className="text-xs font-bold uppercase text-slate-500">Precio online</p>
              {promotion ? <p className="mt-1 text-sm font-bold text-slate-400 line-through">{money(basePrice)}</p> : null}
              <p className="mt-1 text-4xl font-black tracking-tight text-slate-950">{money(displayPrice)}</p>
              {promotion ? (
                <p className="mt-2 flex flex-wrap items-center gap-2">
                  <span className={discountBadgeClass(promotion.badgeColor)}>{promotion.badgeLabel}</span>
                  <span className="text-xs font-black text-[#003f48]">{promotion.campaignName}</span>
                </p>
              ) : null}
            </div>
            <p className={`mt-3 inline-flex rounded border px-3 py-1 text-sm font-bold ${stock > 0 ? "border-[#098d8f]/30 bg-[#098d8f]/5 text-[#098d8f]" : "border-[#003f48]/30 bg-[#003f48]/5 text-[#003f48]"}`}>
              {stock > 0 ? `${stock} disponible(s)` : requestOnly ? "A pedido" : "Sin stock"}
            </p>
            {requestOnly ? (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                <p className="font-black">Producto disponible a pedido</p>
                <p className="mt-1 text-xs font-semibold">Entrega estimada: {requestLabel.toLowerCase()} para Huaraz. Se confirma por WhatsApp antes de coordinar el pago o envio.</p>
              </div>
            ) : null}

            <div className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
              <Feature icon={<Truck className="h-5 w-5" />} title="Entrega" text={requestOnly ? `A pedido, ${requestLabel.toLowerCase()}` : "Envio a Lima, provincia y recojo en tienda"} />
              <Feature icon={<ShieldCheck className="h-5 w-5" />} title="Garantia" text="Garantia segun producto y validacion en tienda" />
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
              <Info label="Marca" value={product.brand} />
              <Info label="Modelo" value={product.commercialModel ?? product.name} />
              <Info label="Plataforma" value={product.platform ?? "No aplica"} />
              <Info label="Color" value={product.color ?? "No especificado"} />
              <Info label="Almacenamiento" value={product.storage ?? "No aplica"} />
              <Info label="RAM" value={product.ram ?? "Opcional"} />
              <Info label="Condicion" value={productConditionLabel(product.condition)} />
              <Info label="Disponibilidad" value={stock > 0 ? "Stock inmediato" : requestOnly ? requestLabel : "Sin stock"} />
              <Info label="Equipo" value={product.productType.requiresImei ? "Registrado/validado" : "Accesorio original o compatible"} />
            </dl>

            <p className="mt-5 text-sm leading-6 text-slate-600">{product.shortDescription ?? "Producto disponible en DIMENSITECH STORE con stock actualizado desde inventario real."}</p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <AddToCartButton item={cartItem} disabled={stock <= 0} className="inline-flex h-20 min-h-20 flex-1 items-center justify-center gap-2.5 rounded-md border border-[#098d8f] bg-[#098d8f] px-5 py-4 text-base font-bold text-white shadow-sm transition hover:bg-[#003f48] active:bg-[#003f48] disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-100 disabled:text-slate-400 lg:h-11 lg:min-h-11 lg:bg-white lg:px-4 lg:py-0 lg:text-sm lg:text-[#098d8f] lg:hover:bg-[#098d8f] lg:hover:text-white">
                <ShoppingCart className="h-5 w-5 lg:h-4 lg:w-4" />
                {requestOnly ? "Disponible solo a pedido" : "Anadir al carrito"}
              </AddToCartButton>
              <a href={`https://wa.me/${phone}?text=${message}`} target="_blank" className="inline-flex h-20 min-h-20 flex-1 items-center justify-center gap-2.5 rounded-md border border-slate-300 px-5 py-4 text-base font-bold text-slate-800 hover:bg-slate-50 lg:h-11 lg:min-h-11 lg:px-4 lg:py-0 lg:text-sm">
                <MessageCircle className="h-5 w-5 lg:h-4 lg:w-4" />
                Consultar por WhatsApp
              </a>
            </div>
            <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
              <p className="mb-2 text-xs font-black uppercase text-slate-500">Metodos de pago aceptados</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {paymentMethods.map((method) => (
                  <img
                    key={method.src}
                    src={method.src}
                    width="120"
                    height="40"
                    alt={method.alt}
                    className="h-10 w-full rounded-md border border-slate-200 bg-white p-1 object-contain"
                  />
                ))}
              </div>
            </div>
          </section>
        </Card>

        <section>
          <h2 className="mb-3 text-xl font-black">Productos relacionados</h2>
          <ProductGrid products={related} compact />
        </section>
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md bg-slate-50 p-3"><dt className="text-xs font-bold text-slate-500">{label}</dt><dd className="font-bold text-slate-800">{value}</dd></div>;
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="flex gap-3 rounded-md border border-slate-200 p-3 text-slate-700">{icon}<div><p className="font-bold">{title}</p><p className="text-xs text-slate-500">{text}</p></div></div>;
}
