"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { saveProductImageUpload } from "@/lib/uploads";
import { productSkuSchema } from "@/lib/validators";

export async function saveProductSku(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const uploadedImageUrl = await saveProductImageUpload(formData.get("imageFile") as File);
  let imageId = raw.imageId ? Number(raw.imageId) : null;

  if (uploadedImageUrl) {
    const modelName = String(formData.get("imageModelName") || raw.commercialModel || raw.name || "Producto");
    const image = await prisma.productImageLibrary.create({
      data: {
        productTypeId: Number(raw.productTypeId),
        brand: String(raw.brand || ""),
        productName: modelName,
        commercialModel: String(raw.commercialModel || raw.name || ""),
        platform: String(raw.platform || "") as any || null,
        color: String(raw.color || ""),
        imageUrl: uploadedImageUrl,
        altText: `${raw.brand ?? ""} ${raw.name ?? modelName}`.trim()
      }
    });
    imageId = image.id;
  }

  const data = productSkuSchema.parse({
    ...raw,
    platform: raw.platform ? raw.platform : null,
    visibleInStore: raw.visibleInStore === "on",
    availableOnRequest: raw.availableOnRequest === "on",
    requestDeliveryDays: raw.availableOnRequest === "on" && raw.requestDeliveryDays ? Number(raw.requestDeliveryDays) : null,
    imageId
  });
  const id = Number(formData.get("id"));
  if (id) await prisma.productSku.update({ where: { id }, data });
  else {
    await prisma.productSku.upsert({
      where: { skuCode: data.skuCode },
      update: data,
      create: data
    });
  }
  revalidatePath("/admin/productos");
  revalidatePath("/admin/imagenes");
  redirect("/admin/productos");
}
