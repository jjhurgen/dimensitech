import type { LucideIcon } from "lucide-react";
import { Cable, Headphones, Percent, Shield, Smartphone, TabletSmartphone, Zap } from "lucide-react";

export type StoreCategory = {
  icon: LucideIcon;
  label: string;
  href: string;
};

export const storeCategories = [
  { icon: Smartphone, label: "Celulares", href: "/tienda?categoria=celulares" },
  { icon: TabletSmartphone, label: "iPhone", href: "/tienda?plataforma=IPHONE" },
  { icon: Smartphone, label: "Android", href: "/tienda?plataforma=ANDROID" },
  { icon: Zap, label: "Samsung", href: "/tienda?marca=samsung" },
  { icon: Zap, label: "Xiaomi", href: "/tienda?marca=xiaomi" },
  { icon: Shield, label: "Cases", href: "/tienda?tipo=case" },
  { icon: Cable, label: "Cables", href: "/tienda?tipo=cable" },
  { icon: Headphones, label: "Audio", href: "/tienda?tipo=audifono" },
  { icon: Percent, label: "Ofertas", href: "/tienda?sort=ofertas" }
] satisfies StoreCategory[];
