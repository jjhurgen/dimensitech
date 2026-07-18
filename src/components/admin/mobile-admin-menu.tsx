"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BarChart3, Bell, Boxes, ClipboardList, CreditCard, Home, Image, ListTree, Megaphone, Menu, Package, Percent, Settings, ShoppingBag, Tags, Truck, UserCog, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { logoutAction } from "@/app/login/actions";
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

export function MobileAdminMenu({ pendingReservations, role }: { pendingReservations: number; role?: string }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const visibleItems = items.filter(([, label]) => label !== "Usuarios" || role === "ADMIN");

  useEffect(() => {
    setMounted(true);
  }, []);

  const drawer = open ? (
    <div className="fixed inset-0 z-[100] lg:hidden">
      <button type="button" className="absolute inset-0 bg-slate-950/55" onClick={() => setOpen(false)} aria-label="Cerrar menu" />
      <aside className="absolute inset-y-0 left-0 flex h-dvh w-[88vw] max-w-80 flex-col bg-[#0B1220] text-white shadow-2xl">
        <div className="flex h-20 shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-white p-0.5 shadow-lg shadow-blue-950/40 ring-1 ring-white/20">
              <img src="/uploads/logo/logo.jpg" alt="DimensiTech Store" className="h-full w-full object-contain" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-black tracking-wide">DIMENSITECH</p>
              <p className="text-xs text-slate-400">Gestion comercial</p>
            </div>
          </div>
          <button type="button" onClick={() => setOpen(false)} className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-white/10 text-white hover:bg-white/15" aria-label="Cerrar menu">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3 pb-6">
          {visibleItems.map(([Icon, label, href]) => {
            const isActive = href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex min-h-12 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold text-slate-100 transition hover:bg-white/10",
                  isActive ? "bg-[#098d8f] text-white shadow-lg shadow-[#098d8f]/20" : "bg-white/[0.04]"
                )}
              >
                <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-md", isActive ? "bg-white/15" : "bg-white/10")}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1 truncate">{label}</span>
                {href === "/admin/reservas" && pendingReservations > 0 ? (
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-black", isActive ? "bg-white text-[#003f48]" : "bg-[#098d8f] text-white")}>
                    {pendingReservations}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
        <form action={logoutAction} className="border-t border-white/10 p-3">
          <button type="submit" className="flex h-11 w-full items-center justify-center rounded-lg bg-white/10 px-4 text-sm font-black text-white transition hover:bg-white/15">
            Cerrar sesion
          </button>
        </form>
      </aside>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-sm lg:hidden"
        aria-label="Abrir menu administrativo"
      >
        <Menu className="h-5 w-5" />
      </button>

      {mounted ? createPortal(drawer, document.body) : null}
    </>
  );
}
