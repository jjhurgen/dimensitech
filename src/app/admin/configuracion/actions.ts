"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const allowedReservationMinutes = new Set(["15", "60", "720", "1440"]);

export async function updateReservationExpirationAction(formData: FormData) {
  await requireUser();
  const minutes = String(formData.get("reservationExpirationMinutes") ?? "1440");
  if (!allowedReservationMinutes.has(minutes)) {
    throw new Error("Tiempo de reserva no valido");
  }

  await prisma.setting.upsert({
    where: { key: "reservation_expiration_minutes" },
    update: { value: minutes },
    create: { key: "reservation_expiration_minutes", value: minutes }
  });

  revalidatePath("/admin/configuracion");
  redirect("/admin/configuracion");
}
