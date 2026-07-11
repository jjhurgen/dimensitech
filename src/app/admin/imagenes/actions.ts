"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { saveProductImageUpload } from "@/lib/uploads";

export async function saveImageLibrary(formData: FormData) {
  const productSkuId = Number(formData.get("productSkuId"));
  const sku = productSkuId
    ? await prisma.productSku.findUnique({ where: { id: productSkuId }, include: { productType: true } })
    : null;
  const uploadedImageUrl = await saveProductImageUpload(formData.get("imageFile") as File);
  if (!uploadedImageUrl) throw new Error("Seleccione una imagen para subir");

  const modelName = String(formData.get("modelName") || sku?.commercialModel || sku?.name || "").trim();
  const image = await prisma.productImageLibrary.create({
    data: {
      productTypeId: sku?.productTypeId ?? null,
      brand: sku?.brand ?? "",
      productName: modelName || "Imagen de producto",
      commercialModel: sku?.commercialModel ?? modelName,
      platform: sku?.platform ?? null,
      color: sku?.color ?? "",
      imageUrl: uploadedImageUrl,
      altText: modelName || sku ? `${sku?.brand ?? ""} ${sku?.name ?? modelName}`.trim() : "Imagen de producto"
    }
  });

  if (sku) await prisma.productSku.update({ where: { id: sku.id }, data: { imageId: image.id } });

  revalidatePath("/admin/imagenes");
  revalidatePath("/admin/productos");
  revalidatePath("/tienda");
  redirect("/admin/imagenes");
}

export async function assignProductImage(formData: FormData) {
  const productSkuId = Number(formData.get("productSkuId"));
  const imageId = Number(formData.get("imageId"));
  if (!productSkuId || !imageId) throw new Error("Producto e imagen requeridos");

  await prisma.productSku.update({ where: { id: productSkuId }, data: { imageId } });
  revalidatePath("/admin/imagenes");
  revalidatePath("/admin/productos");
  revalidatePath("/tienda");
  redirect("/admin/imagenes");
}

export async function deleteImageLibrary(formData: FormData) {
  const imageId = Number(formData.get("imageId"));
  if (!imageId) throw new Error("Imagen requerida");

  await prisma.$transaction(async (tx) => {
    await tx.productSku.updateMany({ where: { imageId }, data: { imageId: null } });
    await tx.productImageLibrary.delete({ where: { id: imageId } });
  });

  revalidatePath("/admin/imagenes");
  revalidatePath("/admin/productos");
  revalidatePath("/tienda");
  redirect("/admin/imagenes");
}
