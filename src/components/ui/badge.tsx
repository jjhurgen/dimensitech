import { cn } from "@/lib/utils";

const variants: Record<string, string> = {
  AVAILABLE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  RESERVED: "border-amber-200 bg-amber-50 text-amber-700",
  SOLD: "border-red-200 bg-red-50 text-red-700",
  CANCELLED: "border-slate-200 bg-slate-100 text-slate-700",
  INACTIVE: "border-slate-200 bg-slate-100 text-slate-700",
  PENDING: "border-blue-200 bg-blue-50 text-blue-700",
  CONFIRMED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  EXPIRED: "border-slate-200 bg-slate-100 text-slate-700"
};

const labels: Record<string, string> = {
  AVAILABLE: "Disponible",
  ACTIVE: "Activo",
  RESERVED: "Reservado",
  SOLD: "Vendido",
  CANCELLED: "Cancelado",
  INACTIVE: "Inactivo",
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  PARTIAL_CONFIRMED: "Confirmado parcial",
  EXPIRED: "Vencido",
  REGISTERED: "Registrado",
  PARTIAL: "Parcial",
  ADMIN: "Administrador",
  SELLER: "Vendedor",
  WAREHOUSE: "Almacen",
  STORE_PICKUP: "Recojo en tienda",
  LIMA: "Lima",
  PROVINCE: "Provincia",
  DELIVERY: "Delivery Huaraz"
};

export function Badge({ children, value }: { children?: React.ReactNode; value?: string }) {
  const key = value ?? String(children);
  return <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold", variants[key] ?? "border-slate-200 bg-slate-100 text-slate-700")}>{children ?? labels[key] ?? value}</span>;
}
