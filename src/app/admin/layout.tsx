import { Header } from "@/components/admin/header";
import { Sidebar } from "@/components/admin/sidebar";
import { requireUser } from "@/lib/auth";
import { expireReservations } from "@/lib/services/reservations";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (user.mustChangePassword) redirect("/cambiar-contrasena");
  await expireReservations();
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="lg:pl-72">
        <Header />
        <main className="max-w-full overflow-x-hidden p-3 sm:p-4 lg:p-6 xl:p-8">{children}</main>
      </div>
    </div>
  );
}
