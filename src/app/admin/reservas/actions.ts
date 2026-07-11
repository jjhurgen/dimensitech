"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { cancelReservation, cancelReservationItem, confirmReservationSale, expireReservations } from "@/lib/services/reservations";

export async function expireReservationsAction() {
  await expireReservations();
  revalidatePath("/admin/reservas");
  revalidatePath("/admin/inventario");
  revalidatePath("/tienda");
  redirect("/admin/reservas");
}

export async function cancelReservationAction(formData: FormData) {
  const user = await requireUser();
  const reservationId = Number(formData.get("reservationId"));
  const returnTo = String(formData.get("returnTo") || "/admin/reservas");
  await cancelReservation(reservationId, user.id);
  revalidatePath("/admin/reservas");
  if (returnTo.startsWith("/admin/reservas/")) revalidatePath(returnTo);
  revalidatePath("/tienda");
  redirect(returnTo);
}

export async function cancelReservationItemAction(formData: FormData) {
  const user = await requireUser();
  const returnTo = String(formData.get("returnTo") || "/admin/reservas");
  await cancelReservationItem(Number(formData.get("reservationItemId")), user.id);
  revalidatePath("/admin/reservas");
  if (returnTo.startsWith("/admin/reservas/")) revalidatePath(returnTo);
  revalidatePath("/admin/inventario");
  revalidatePath("/tienda");
  redirect(returnTo);
}

export async function confirmReservationAction(formData: FormData) {
  const user = await requireUser();
  const reservationId = Number(formData.get("reservationId"));
  const returnTo = String(formData.get("returnTo") || "/admin/reservas");
  await confirmReservationSale(reservationId, user.id);
  revalidatePath("/admin/reservas");
  if (returnTo.startsWith("/admin/reservas/")) revalidatePath(returnTo);
  revalidatePath("/admin/ventas");
  revalidatePath("/admin/inventario");
  revalidatePath("/tienda");
  redirect(returnTo);
}
