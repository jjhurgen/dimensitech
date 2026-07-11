"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { registerPurchase } from "@/lib/services/purchases";

function lines(value: FormDataEntryValue | null) {
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim());
}

function buildPurchaseItems(formData: FormData) {
  const rawItems = String(formData.get("items") || "").trim();
  if (rawItems) return JSON.parse(rawItems);

  const imei1List = lines(formData.get("imei1List")).filter(Boolean);
  const imei2List = lines(formData.get("imei2List"));
  const serialNumberList = lines(formData.get("serialNumberList"));
  const modelNumberList = lines(formData.get("modelNumberList"));

  return [
    {
      productSkuId: Number(formData.get("productSkuId")),
      quantity: Number(formData.get("quantity") || 1),
      unitPurchasePrice: Number(formData.get("unitPurchasePrice") || 0),
      phones: imei1List.map((imei1, index) => ({
        imei1,
        imei2: imei2List[index] || "",
        serialNumber: serialNumberList[index] || "",
        modelNumber: modelNumberList[index] || ""
      }))
    }
  ];
}

export async function registerPurchaseAction(formData: FormData) {
  const user = await requireUser();
  const items = buildPurchaseItems(formData);
  await registerPurchase(
    {
      providerId: Number(formData.get("providerId")),
      purchaseDate: new Date(String(formData.get("purchaseDate"))),
      freightAmount: Number(formData.get("freightAmount") || 0),
      notes: String(formData.get("notes") || ""),
      items
    },
    user.id
  );
  revalidatePath("/admin/compras");
  redirect("/admin/compras");
}
