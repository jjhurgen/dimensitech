"use client";

import Link from "next/link";
import { Bell, X } from "lucide-react";
import { useState } from "react";
import { money } from "@/lib/utils";

type PendingOrder = {
  id: number;
  reservationCode: string;
  customerName: string;
  customerPhone: string;
  totalEstimated: number;
  expiresAt: string;
  itemsSummary: string;
};

export function OrdersNotificationButton({ unread, pendingOrders }: { unread: number; pendingOrders: PendingOrder[] }) {
  const [open, setOpen] = useState(false);
  const count = pendingOrders.length || unread;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white hover:bg-slate-50"
        title="Ver pedidos pendientes"
      >
        <Bell className="h-5 w-5 text-slate-600" />
        {count > 0 ? <span className="absolute -right-2 -top-2 rounded-full bg-[#098d8f] px-1.5 text-[10px] font-black text-white">{count}</span> : null}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50">
          <button className="absolute inset-0 bg-slate-950/30" onClick={() => setOpen(false)} aria-label="Cerrar notificaciones" />
          <section className="absolute right-4 top-20 w-[calc(100vw-2rem)] max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20">
            <div className="flex items-center justify-between border-b border-slate-200 p-4">
              <div>
                <h2 className="font-black text-slate-950">Pedidos pendientes</h2>
                <p className="text-xs font-medium text-slate-500">Solicitudes web por confirmar</p>
              </div>
              <button onClick={() => setOpen(false)} className="grid h-8 w-8 place-items-center rounded-md bg-slate-100 hover:bg-slate-200">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-3">
              {pendingOrders.length ? (
                <div className="space-y-2">
                  {pendingOrders.map((order) => (
                    <Link
                      key={order.id}
                      href={`/admin/reservas/${encodeURIComponent(order.reservationCode)}`}
                      onClick={() => setOpen(false)}
                      className="block rounded-lg border border-slate-200 p-3 transition hover:border-[#098d8f] hover:bg-[#098d8f]/5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-black text-slate-950">{order.reservationCode}</p>
                          <p className="text-sm font-semibold text-slate-700">{order.customerName}</p>
                        </div>
                        <span className="text-sm font-black text-[#003f48]">{money(order.totalEstimated)}</span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-xs text-slate-600">{order.itemsSummary}</p>
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                        <span>{order.customerPhone}</span>
                        <span>Vence: {new Date(order.expiresAt).toLocaleString("es-PE")}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="grid min-h-40 place-items-center rounded-lg border border-dashed border-slate-200 p-6 text-center">
                  <div>
                    <p className="font-black text-slate-900">Sin pedidos pendientes</p>
                    <p className="mt-1 text-sm text-slate-500">Las nuevas solicitudes apareceran aqui.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 p-3">
              <Link href="/admin/reservas" onClick={() => setOpen(false)} className="flex h-10 items-center justify-center rounded-md bg-[#098d8f] text-sm font-bold text-white hover:bg-[#003f48]">
                Ver todas las reservas web
              </Link>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
