"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { providerSchema } from "@/lib/validators";

export async function saveProvider(formData: FormData) {
  const data = providerSchema.parse(Object.fromEntries(formData));
  const id = Number(formData.get("id"));
  const productTypeIds = formData
    .getAll("productTypeIds")
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0);

  if (id) {
    await prisma.provider.update({
      where: { id },
      data: {
        ...data,
        productTypes: {
          deleteMany: {},
          create: productTypeIds.map((productTypeId) => ({ productTypeId }))
        }
      }
    });
  } else {
    await prisma.provider.create({
      data: {
        ...data,
        productTypes: {
          create: productTypeIds.map((productTypeId) => ({ productTypeId }))
        }
      }
    });
  }
  revalidatePath("/admin/proveedores");
  redirect("/admin/proveedores");
}
