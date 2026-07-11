import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { cancelReservationAction, cancelReservationItemAction, confirmReservationAction, expireReservationsAction } from "./actions";
import { ConfirmActionForm } from "@/components/admin/confirm-action-form";
import { Pager } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { money, pageParams } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

function shippingLabel(value: string) {
  if (value === "STORE_PICKUP") return "Recojo en tienda";
  if (value === "LIMA") return "Envio a Lima";
  if (value === "DELIVERY") return "Delivery en Huaraz";
  return "Envio a provincia";
}

function dateRangeFromSearch(value: string) {
  const trimmed = value.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  const local = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
  const parts = iso
    ? { year: Number(iso[1]), month: Number(iso[2]), day: Number(iso[3]) }
    : local
      ? { year: Number(local[3]), month: Number(local[2]), day: Number(local[1]) }
      : null;

  if (!parts) return null;
  const start = new Date(parts.year, parts.month - 1, parts.day, 0, 0, 0, 0);
  const end = new Date(parts.year, parts.month - 1, parts.day + 1, 0, 0, 0, 0);
  return Number.isNaN(start.getTime()) ? null : { start, end };
}

function reservationWhere(q: string): Prisma.ReservationWhereInput {
  if (!q) return {};
  const dateRange = dateRangeFromSearch(q);
  return {
    OR: [
      { reservationCode: { contains: q } },
      { customerName: { contains: q } },
      { customerDni: { contains: q } },
      { customerPhone: { contains: q } },
      ...(dateRange
        ? [
            { createdAt: { gte: dateRange.start, lt: dateRange.end } },
            { expiresAt: { gte: dateRange.start, lt: dateRange.end } }
          ]
        : [])
    ]
  };
}

export default async function ReservationsAdminPage({ searchParams }: { searchParams?: Promise<Record<string, string>> }) {
  const params = (await searchParams) ?? {};
  const { page, q, take, skip } = pageParams(params);
  const where = reservationWhere(q);
  const [rows, total] = await Promise.all([
    prisma.reservation.findMany({
      where,
      include: { items: { include: { productSku: true } } },
      skip,
      take,
      orderBy: { id: "desc" }
    }),
    prisma.reservation.count({ where })
  ]);

  return (
    <Card className="overflow-hidden p-0">
      <div className="space-y-4 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold">Reservas web</h1>
            <p className="text-sm text-slate-500">Busca por codigo, nombre, DNI, telefono o fecha.</p>
          </div>
          <form action={expireReservationsAction}>
            <Button>Vencer expiradas</Button>
          </form>
        </div>

        <form className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
          <Input name="q" defaultValue={q} placeholder="RES-000004, Marco, 75689898, 2026-07-11 o 11/07/2026" />
          <Button type="submit">Buscar</Button>
          {q ? (
            <Link href="/admin/reservas" className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50">
              Limpiar
            </Link>
          ) : null}
        </form>
      </div>

      <div className="space-y-3 border-t border-slate-100 bg-slate-50/60 p-3 sm:p-4">
        {rows.length ? (
          rows.map((row) => {
            const pendingItems = row.items.filter((item) => item.status === "PENDING");
            const destination = [row.destinationCity, row.destinationProvince, row.destinationDepartment].filter(Boolean).join(", ");
            return (
              <details key={row.id} className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <summary className="grid cursor-pointer list-none gap-3 px-3 py-3 hover:bg-slate-50 sm:grid-cols-[1.2fr_1fr_auto] sm:items-center sm:px-4 [&::-webkit-details-marker]:hidden">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-black text-slate-950 group-open:text-[#098d8f]">{row.reservationCode}</span>
                      <Badge value={row.status} />
                    </div>
                    <p className="mt-1 truncate text-sm font-bold text-slate-800">{row.customerName}</p>
                    <p className="text-xs text-slate-500">{row.customerPhone}{row.customerDni ? ` | DNI: ${row.customerDni}` : ""}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
                    <div>
                      <p className="font-bold text-slate-500">Total</p>
                      <p className="font-black text-slate-950">{money(row.totalEstimated)}</p>
                    </div>
                    <div>
                      <p className="font-bold text-slate-500">Vence</p>
                      <p className="font-bold text-slate-800">{row.expiresAt.toLocaleString("es-PE")}</p>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <p className="font-bold text-slate-500">Entrega</p>
                      <p className="font-bold text-slate-800">{shippingLabel(row.shippingType)}</p>
                    </div>
                  </div>

                  <span className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 px-3 text-sm font-bold text-slate-700 group-open:border-[#098d8f] group-open:text-[#098d8f]">
                    Ver detalle
                  </span>
                </summary>

                <div className="border-t border-slate-100 p-3 sm:p-4">
                  <div className="grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
                    <section className="rounded-lg bg-slate-50 p-3">
                      <h2 className="text-sm font-black text-slate-900">Cliente</h2>
                      <p className="mt-2 text-sm font-bold text-slate-800">{row.customerName}</p>
                      <p className="text-sm text-slate-600">{row.customerPhone}</p>
                      <p className="text-sm text-slate-600">{row.customerDni ? `DNI: ${row.customerDni}` : "Documento no indicado"}</p>
                    </section>

                    <section className="rounded-lg bg-slate-50 p-3">
                      <h2 className="text-sm font-black text-slate-900">Entrega</h2>
                      <p className="mt-2 text-sm font-bold text-slate-800">{shippingLabel(row.shippingType)}</p>
                      {row.shippingType === "STORE_PICKUP" ? (
                        <p className="text-sm text-slate-600">Recojo en tienda</p>
                      ) : (
                        <>
                          <p className="text-sm text-slate-600">{destination || "Sin destino adicional"}</p>
                          <p className="text-sm text-slate-600">{row.addressReference || "Sin referencia"}</p>
                        </>
                      )}
                    </section>

                    <section className="rounded-lg bg-slate-50 p-3">
                      <h2 className="text-sm font-black text-slate-900">Resumen</h2>
                      <p className="mt-2 text-sm font-bold text-slate-800">{money(row.totalEstimated)}</p>
                      <p className="text-sm text-slate-600">{pendingItems.length} item(s) pendiente(s)</p>
                      <Link href={`/admin/reservas/${encodeURIComponent(row.reservationCode)}`} className="mt-3 inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
                        Abrir ficha
                      </Link>
                    </section>
                  </div>

                  <section className="mt-3 space-y-2">
                    <h2 className="text-sm font-black text-slate-900">Productos</h2>
                    {row.items.map((item) => (
                      <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="font-bold text-slate-900">{item.productSku.brand} {item.productSku.name}</p>
                            <p className="text-xs text-slate-500">Cantidad: {item.quantityRequested} | Precio: {money(item.unitPrice)}</p>
                            {item.discountLabel ? (
                              <p className="mt-1 text-xs font-bold text-[#098d8f]">
                                {item.discountLabel} {item.discountCampaignName ? `| ${item.discountCampaignName}` : ""} | Antes: {money(item.originalUnitPrice)}
                              </p>
                            ) : null}
                          </div>
                          <Badge value={item.status} />
                        </div>
                        {row.status === "PENDING" && item.status === "PENDING" ? (
                          <form action={cancelReservationItemAction} className="mt-2">
                            <input type="hidden" name="reservationItemId" value={item.id} />
                            <Button className="h-8 bg-slate-700 px-3 text-xs hover:bg-slate-800">Anular item</Button>
                          </form>
                        ) : null}
                      </div>
                    ))}
                  </section>

                  {row.status === "PENDING" ? (
                    <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                      {pendingItems.length ? (
                        <ConfirmActionForm
                          action={confirmReservationAction}
                          hiddenFields={{ reservationId: row.id }}
                          triggerLabel="Confirmar venta"
                          title="Confirmar venta"
                          message={`Se convertira la reserva ${row.reservationCode} en una venta y solo se venderan los items pendientes. Esta accion no se puede deshacer automaticamente.`}
                          confirmLabel="Si, confirmar venta"
                        />
                      ) : null}
                      <ConfirmActionForm
                        action={cancelReservationAction}
                        hiddenFields={{ reservationId: row.id }}
                        triggerLabel="Cancelar todo"
                        title="Cancelar reserva completa"
                        message={`Se cancelara la reserva ${row.reservationCode}, se liberara el stock apartado y todos los items pendientes quedaran anulados.`}
                        confirmLabel="Si, cancelar todo"
                        variant="danger"
                      />
                    </div>
                  ) : null}
                </div>
              </details>
            );
          })
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="font-black text-slate-900">No se encontraron reservas</p>
            <p className="mt-1 text-sm text-slate-500">Prueba con otro codigo, nombre, DNI o fecha.</p>
          </div>
        )}
      </div>

      <Pager page={page} total={total} basePath="/admin/reservas" searchParams={q ? { q } : {}} />
    </Card>
  );
}
