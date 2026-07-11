"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { customerSchema } from "@/lib/validators";

export async function saveCustomer(formData: FormData) {
  const data = customerSchema.parse(Object.fromEntries(formData));
  const id = Number(formData.get("id"));
  if (id) await prisma.customer.update({ where: { id }, data });
  else await prisma.customer.create({ data });
  revalidatePath("/admin/clientes");
  redirect("/admin/clientes");
}
