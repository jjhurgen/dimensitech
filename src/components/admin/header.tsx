import { Search } from "lucide-react";
import { logoutAction } from "@/app/login/actions";
import { MobileAdminMenu } from "@/components/admin/mobile-admin-menu";
import { OrdersNotificationButton } from "@/components/admin/orders-notification-button";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function Header() {
  const user = await currentUser();
  const [unread, pendingOrders, pendingReservations] = await Promise.all([
    prisma.notification.count({ where: { isRead: false } }),
    prisma.reservation.findMany({
      where: { status: "PENDING" },
      include: { items: { include: { productSku: true } } },
      orderBy: { id: "desc" },
      take: 8
    }),
    prisma.reservation.count({ where: { status: "PENDING" } })
  ]);
  return (
    <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-3 py-3 shadow-sm shadow-slate-200/70 backdrop-blur sm:px-4 lg:min-h-20 lg:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <MobileAdminMenu pendingReservations={pendingReservations} role={user?.role} />
        <div className="min-w-0">
          <p className="text-base font-black text-slate-950">Panel administrativo</p>
          <p className="hidden text-xs font-medium text-slate-500 sm:block">Operacion, inventario y ventas</p>
        </div>
      </div>
      <div className="hidden max-w-md flex-1 px-8 xl:block">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="h-10 w-full rounded-full border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100" placeholder="Buscar ventas, clientes o IMEI..." />
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <OrdersNotificationButton
          unread={unread}
          pendingOrders={pendingOrders.map((order) => ({
            id: order.id,
            reservationCode: order.reservationCode,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            totalEstimated: Number(order.totalEstimated),
            expiresAt: order.expiresAt.toISOString(),
            itemsSummary: order.items.map((item) => `${item.productSku.brand} ${item.productSku.name} x${item.quantityRequested}`).join(", ")
          }))}
        />
        <div className="hidden rounded-full border border-slate-200 bg-white py-1 pl-3 pr-4 text-right text-sm shadow-sm sm:block">
          <p className="font-bold text-slate-950">{user?.name}</p>
          <p className="text-xs font-medium text-slate-500">{user?.role}</p>
        </div>
        <form action={logoutAction} className="hidden sm:block">
          <button type="submit" className="h-10 rounded-full border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50">
            Cerrar sesion
          </button>
        </form>
      </div>
    </header>
  );
}
