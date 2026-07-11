import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cancelReservationAction, cancelReservationItemAction, confirmReservationAction } from "../actions";
import { ConfirmActionForm } from "@/components/admin/confirm-action-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { money } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export default async function ReservationDetailPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const reservation = await prisma.reservation.findUnique({
    where: { reservationCode: decodeURIComponent(code) },
    include: {
      items: { include: { productSku: true, phoneUnit: true }, orderBy: { id: "asc" } }
    }
  });
  if (!reservation) notFound();

  const reservationPath = `/admin/reservas/${encodeURIComponent(reservation.reservationCode)}`;
  const pendingItems = reservation.items.filter((item) => item.status === "PENDING");
  const shippingLabel =
    reservation.shippingType === "STORE_PICKUP"
      ? "Recojo en tienda"
      : reservation.shippingType === "LIMA"
        ? "Envio a Lima"
        : reservation.shippingType === "DELIVERY"
          ? "Delivery en Huaraz"
          : "Envio a provincia";
  const deliveryLines =
    reservation.shippingType === "STORE_PICKUP"
      ? [shippingLabel]
      : [
          shippingLabel,
          [reservation.destinationCity, reservation.destinationProvince, reservation.destinationDepartment].filter(Boolean).join(", ") || "Sin destino adicional",
          reservation.addressReference || "Sin referencia"
        ];

  return (
    <div className="space-y-4">
      <Link href="/admin/reservas" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-[#098d8f]">
        <ArrowLeft className="h-4 w-4" />
        Volver a reservas web
      </Link>

      <Card className="space-y-5">
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase text-slate-500">Reserva web</p>
            <h1 className="mt-1 text-2xl font-black text-slate-950">{reservation.reservationCode}</h1>
            <p className="mt-1 text-sm text-slate-500">Creada: {reservation.createdAt.toLocaleString("es-PE")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge value={reservation.status} />
            {reservation.status === "PENDING" ? (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                Vence: {reservation.expiresAt.toLocaleString("es-PE")}
              </span>
            ) : null}
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <Info title="Cliente" lines={[reservation.customerName, reservation.customerPhone, reservation.customerDni ? `Doc: ${reservation.customerDni}` : "Documento no indicado"]} />
          <Info title="Entrega" lines={deliveryLines} />
          <Info title="Total estimado" lines={[money(reservation.totalEstimated), `${pendingItems.length} item(s) pendiente(s)`]} strong />
        </section>

        {reservation.whatsappMessage ? (
          <section className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <h2 className="mb-2 text-sm font-black text-slate-900">Mensaje enviado a WhatsApp</h2>
            <pre className="whitespace-pre-wrap text-xs leading-5 text-slate-600">{reservation.whatsappMessage}</pre>
          </section>
        ) : null}

        <section>
          <h2 className="mb-3 text-lg font-black text-slate-950">Productos del pedido</h2>
          <div className="space-y-3">
            {reservation.items.map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-black text-slate-950">{item.productSku.brand} {item.productSku.name}</p>
                    <p className="text-sm text-slate-500">
                      Cantidad: {item.quantityRequested} | Precio unitario: {money(item.unitPrice)} | Total: {money(Number(item.unitPrice) * item.quantityRequested)}
                    </p>
                    {item.discountLabel ? (
                      <p className="mt-1 text-sm font-bold text-[#098d8f]">
                        {item.discountLabel} {item.discountCampaignName ? `| ${item.discountCampaignName}` : ""} | Precio normal: {money(item.originalUnitPrice)} | Descuento: {money(item.discountUnitAmount)}
                      </p>
                    ) : null}
                    {item.phoneUnit ? <p className="text-xs text-slate-500">IMEI: {item.phoneUnit.imei1}</p> : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge value={item.status} />
                    {reservation.status === "PENDING" && item.status === "PENDING" ? (
                      <form action={cancelReservationItemAction}>
                        <input type="hidden" name="reservationItemId" value={item.id} />
                        <input type="hidden" name="returnTo" value={reservationPath} />
                        <Button className="h-9 bg-slate-700 px-3 text-xs hover:bg-slate-800">Anular item</Button>
                      </form>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {reservation.status === "PENDING" ? (
          <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            {pendingItems.length ? (
              <ConfirmActionForm
                action={confirmReservationAction}
                hiddenFields={{ reservationId: reservation.id, returnTo: reservationPath }}
                triggerLabel="Confirmar venta"
                title="Confirmar venta"
                message={`Se convertira la reserva ${reservation.reservationCode} en una venta y solo se venderan los items pendientes. Esta accion no se puede deshacer automaticamente.`}
                confirmLabel="Si, confirmar venta"
              />
            ) : null}
            <ConfirmActionForm
              action={cancelReservationAction}
              hiddenFields={{ reservationId: reservation.id, returnTo: reservationPath }}
              triggerLabel="Cancelar todo"
              title="Cancelar reserva completa"
              message={`Se cancelara la reserva ${reservation.reservationCode}, se liberara el stock apartado y todos los items pendientes quedaran anulados.`}
              confirmLabel="Si, cancelar todo"
              variant="danger"
            />
          </div>
        ) : null}
      </Card>
    </div>
  );
}

function Info({ title, lines, strong = false }: { title: string; lines: string[]; strong?: boolean }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="mb-2 text-sm font-black text-slate-900">{title}</h2>
      <div className="space-y-1">
        {lines.map((line) => (
          <p key={line} className={strong ? "text-lg font-black text-slate-950" : "text-sm text-slate-600"}>{line}</p>
        ))}
      </div>
    </div>
  );
}
