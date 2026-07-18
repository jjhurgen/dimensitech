"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { productTypeSchema } from "@/lib/validators";

const productTypeAdminPath = "/admin/tipos-productos";

function normalizeProductTypeName(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function revalidateProductTypePaths() {
  revalidatePath(productTypeAdminPath);
  revalidatePath("/admin/productos");
  revalidatePath("/admin/compras");
  revalidatePath("/admin/proveedores");
  revalidatePath("/admin/imagenes");
  revalidatePath("/");
  revalidatePath("/tienda");
}

export async function saveProductType(formData: FormData) {
  const id = Number(formData.get("id"));
  const rawName = String(formData.get("name") || "");
  const name = normalizeProductTypeName(rawName);
  const requestedRequiresImei = formData.get("requiresImei") === "on";

  const duplicate = await prisma.productType.findFirst({
    where: {
      name,
      ...(id ? { id: { not: id } } : {})
    },
    select: { id: true }
  });

  if (duplicate) redirect(`${productTypeAdminPath}?error=nombre-existe`);

  const current = id
    ? await prisma.productType.findUnique({
        where: { id },
        include: { _count: { select: { skus: true } } }
      })
    : null;

  if (id && !current) redirect(`${productTypeAdminPath}?error=no-encontrado`);

  const data = productTypeSchema.parse({
    name,
    requiresImei: current && current._count.skus > 0 ? current.requiresImei : requestedRequiresImei,
    defaultMinStock: formData.get("defaultMinStock"),
    status: formData.get("status") || "ACTIVE"
  });

  if (id) await prisma.productType.update({ where: { id }, data });
  else await prisma.productType.create({ data });

  revalidateProductTypePaths();
  redirect(productTypeAdminPath);
}

export async function deleteProductType(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) redirect(`${productTypeAdminPath}?error=no-encontrado`);

  const productType = await prisma.productType.findUnique({
    where: { id },
    include: {
      _count: { select: { skus: true, imageLibrary: true, providerTypes: true } }
    }
  });

  if (!productType) redirect(`${productTypeAdminPath}?error=no-encontrado`);

  const hasRelations = productType._count.skus > 0 || productType._count.imageLibrary > 0 || productType._count.providerTypes > 0;
  if (hasRelations) redirect(`${productTypeAdminPath}?error=tipo-en-uso`);

  await prisma.productType.delete({ where: { id } });

  revalidateProductTypePaths();
  redirect(productTypeAdminPath);
}
