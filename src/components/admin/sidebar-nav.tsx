"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BarChart3, Bell, Boxes, ClipboardList, CreditCard, Home, Image, ListTree, Megaphone, Package, Percent, Settings, ShoppingBag, Tags, Truck, UserCog, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  [Home, "Dashboard", "/admin"],
  [Activity, "Analitica", "/admin/analitica"],
  [Truck, "Compras", "/admin/compras"],
  [CreditCard, "Ventas", "/admin/ventas"],
  [Boxes, "Inventario", "/admin/inventario"],
  [Package, "Productos/SKU", "/admin/productos"],
  [ListTree, "Tipos producto", "/admin/tipos-productos"],
  [Percent, "Descuentos", "/admin/descuentos"],
  [Megaphone, "Banners", "/admin/banners"],
  [Tags, "Marcas", "/admin/marcas"],
  [Image, "Biblioteca", "/admin/imagenes"],
  [ShoppingBag, "Reservas web", "/admin/reservas"],
  [Users, "Clientes", "/admin/clientes"],
  [UserCog, "Usuarios", "/admin/usuarios"],
  [ClipboardList, "Proveedores", "/admin/proveedores"],
  [BarChart3, "Reportes", "/admin/reportes"],
  [Bell, "Notificaciones", "/admin/notificaciones"],
  [Settings, "Configuracion", "/admin/configuracion"]
] as const;

export function SidebarNav({ pendingReservations, role, onNavigate }: { pendingReservations: number; role?: string; onNavigate?: () => void }) {
  const pathname = usePathname();
  const visibleItems = items.filter(([, label]) => label !== "Usuarios" || role === "ADMIN");

  return (
    <nav className="space-y-1 p-4">
      {visibleItems.map(([Icon, label, href]) => {
        const isActive = href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/10 hover:text-white",
              isActive && "bg-[#098d8f] text-white shadow-lg shadow-[#098d8f]/20 hover:bg-[#098d8f]"
            )}
          >
            <span className={cn("grid h-7 w-7 place-items-center rounded-md", isActive ? "bg-white/15" : "bg-transparent")}>
              <Icon className="h-4 w-4" />
            </span>
            <span className="flex-1">{label}</span>
            {href === "/admin/reservas" && pendingReservations > 0 ? (
              <span className={cn("rounded-full px-2 py-0.5 text-xs font-black", isActive ? "bg-white text-[#003f48]" : "bg-[#098d8f] text-white")}>
                {pendingReservations}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
