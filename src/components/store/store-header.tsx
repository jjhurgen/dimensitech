import Link from "next/link";
import { Facebook, LogIn, MapPin, MessageCircle, Music2, Search, ShieldCheck, Truck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { StoreCartButton } from "@/components/store/store-cart-button";
import { StoreCategoriesMenu } from "@/components/store/store-categories-menu";

export function StoreHeader({ search, basePath = "/tienda" }: { search?: string; basePath?: string }) {
  const phone = process.env.WHATSAPP_STORE_PHONE ?? "51999999999";
  const facebookUrl = process.env.NEXT_PUBLIC_FACEBOOK_URL ?? "https://www.facebook.com/profile.php?id=61556826736209";
  const tiktokUrl = process.env.NEXT_PUBLIC_TIKTOK_URL ?? "https://www.tiktok.com/@dimensitech7";
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm shadow-slate-200/60">
      <div className="bg-[#003f48] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-1.5 text-xs font-semibold">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <span className="inline-flex items-center gap-1"><Truck className="h-3.5 w-3.5" /> Envios a todo el Peru</span>
            <span className="hidden items-center gap-1 sm:inline-flex"><ShieldCheck className="h-3.5 w-3.5" /> Stock verificado</span>
          </div>
          <div className="inline-flex shrink-0 items-center gap-2 sm:gap-3">
            <Link href={facebookUrl} target="_blank" className="inline-flex items-center gap-1 text-white hover:text-[#c9f7f7]" aria-label="Facebook">
              <Facebook className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Facebook</span>
            </Link>
            <Link href={tiktokUrl} target="_blank" className="inline-flex items-center gap-1 text-white hover:text-[#c9f7f7]" aria-label="TikTok">
              <Music2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">TikTok</span>
            </Link>
            <Link href="/login" className="inline-flex h-7 items-center gap-1 rounded-md border border-white/20 bg-white/10 px-2.5 text-xs font-black text-white shadow-sm transition hover:bg-white hover:text-[#003f48] sm:px-3">
              <LogIn className="h-3.5 w-3.5" />
              Entrar
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <Link href={basePath} className="flex min-w-fit items-center gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-white p-0.5 shadow-lg shadow-blue-950/40 ring-1 ring-white/20">
    <img
        src="/uploads/logo/logo.jpg"
        alt="DimensiTech Store"
        className="h-full w-full object-contain"
    />
</div>
          <div className="hidden sm:block">
            <p className="text-sm font-black tracking-wide text-slate-950">DIMENSITECH</p>
            <p className="text-xs font-medium text-slate-500">Celulares y accesorios</p>
          </div>
        </Link>

        <StoreCategoriesMenu basePath={basePath} />

        <form action={basePath} className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <Input
            name="search"
            defaultValue={search}
            placeholder="Buscar iPhone, Samsung, Redmi, cargadores, cases..."
            className="h-10 rounded-md border-slate-300 bg-slate-50 pl-11 text-sm shadow-none focus:bg-white"
          />
        </form>

        <Link href={`https://wa.me/${phone}`} target="_blank" className="hidden h-10 items-center gap-2 rounded-md bg-[#098d8f] px-4 text-sm font-bold text-white shadow-sm hover:bg-[#003f48] md:flex">
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </Link>
        <button className="hidden h-10 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-bold text-slate-700 hover:bg-slate-50 xl:flex">
          <MapPin className="h-4 w-4" />
          Huaraz, Ancash
        </button>
        <StoreCartButton />
      </div>
    </header>
  );
}
