import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export default async function NotificationsPage() {
  const notifications = await prisma.notification.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  return (
    <Card>
      <h1 className="mb-4 text-xl font-bold">Notificaciones</h1>
      <div className="space-y-3">
        {notifications.map((item) => (
          <div key={item.id} className="rounded-md border p-3">
            <div className="flex items-center justify-between"><p className="font-semibold">{item.title}</p><Badge value={item.isRead ? "CANCELLED" : "PENDING"}>{item.isRead ? "Leida" : "Nueva"}</Badge></div>
            <p className="text-sm text-slate-600">{item.message}</p>
            {item.type === "NEW_RESERVATION" ? (
              <Link href="/admin/reservas" className="mt-2 inline-flex rounded-md bg-[#098d8f] px-3 py-2 text-xs font-bold text-white hover:bg-[#003f48]">
                Ver en reservas web
              </Link>
            ) : null}
            <p className="text-xs text-slate-400">{item.createdAt.toLocaleString("es-PE")}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
