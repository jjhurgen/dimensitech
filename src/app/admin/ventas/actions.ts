"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { registerSale } from "@/lib/services/sales";

function buildSaleItems(formData: FormData) {
  const rawItems = String(formData.get("items") || "").trim();
  if (rawItems) return JSON.parse(rawItems);

  const isGift = formData.get("isGift") === "on";
  const itemType = String(formData.get("itemType") || "ACCESSORY");

  return [
    {
      productSkuId: Number(formData.get("productSkuId")),
      phoneUnitId: itemType === "PHONE" && formData.get("phoneUnitId") ? Number(formData.get("phoneUnitId")) : null,
      itemType,
      quantity: itemType === "PHONE" ? 1 : Number(formData.get("quantity") || 1),
      unitSalePrice: Number(formData.get("unitSalePrice") || 0),
      discount: Number(formData.get("discount") || 0),
      isGift
    }
  ];
}

export async function registerSaleAction(formData: FormData) {
  const user = await requireUser();
  const items = buildSaleItems(formData);
  await registerSale(
    {
      customerId: formData.get("customerId") ? Number(formData.get("customerId")) : null,
      customerDocumentType: String(formData.get("customerDocumentType") || "DNI"),
      customerDocumentNumber: String(formData.get("customerDocumentNumber") || ""),
      customerFullName: String(formData.get("customerFullName") || ""),
      saleDate: new Date(String(formData.get("saleDate"))),
      saleChannel: String(formData.get("saleChannel")),
      paymentMethod: String(formData.get("paymentMethod")),
      notes: String(formData.get("notes") || ""),
      items
    },
    user.id
  );
  revalidatePath("/admin/ventas");
  redirect("/admin/ventas");
}
