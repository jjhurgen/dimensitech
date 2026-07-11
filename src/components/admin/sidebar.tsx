import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SidebarNav } from "./sidebar-nav";

export async function Sidebar() {
  const [pendingReservations, user] = await Promise.all([
    prisma.reservation.count({ where: { status: "PENDING" } }),
    currentUser()
  ]);
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-slate-200 bg-[#0B1220] text-white shadow-2xl shadow-slate-950/20 lg:block">
      <div className="flex h-20 items-center gap-3 border-b border-white/10 px-5">
<div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-white p-0.5 shadow-lg shadow-blue-950/40 ring-1 ring-white/20">
    <img
        src="/uploads/logo/logo.jpg"
        alt="DimensiTech Store"
        className="h-full w-full object-contain"
    />
</div>
        <div>
          <p className="text-sm font-black tracking-wide">DIMENSITECH</p>
          <p className="text-xs text-slate-400">Gestion comercial</p>
        </div>
      </div>
      <SidebarNav pendingReservations={pendingReservations} role={user?.role} />
    </aside>
  );
}
