"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function saveBrand(formData: FormData) {
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") || "").trim();
  const status = String(formData.get("status") || "ACTIVE") as "ACTIVE" | "INACTIVE";
  if (name.length < 2) throw new Error("Nombre de marca requerido");

  if (id) {
    await prisma.$executeRaw`UPDATE brands SET name = ${name}, status = ${status}, updated_at = NOW(3) WHERE id = ${id}`;
  } else {
    await prisma.$executeRaw`
      INSERT INTO brands (name, status, created_at, updated_at)
      VALUES (${name}, ${status}, NOW(3), NOW(3))
      ON DUPLICATE KEY UPDATE status = VALUES(status), updated_at = NOW(3)
    `;
  }

  revalidatePath("/admin/marcas");
  revalidatePath("/admin/productos");
  redirect("/admin/marcas");
}
