import { NextResponse } from "next/server";
import { findImageSuggestions } from "@/lib/image-library";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const rows = await findImageSuggestions({
    productTypeId: Number(params.get("productTypeId")) || undefined,
    isPhone: params.get("isPhone") === "true",
    brand: params.get("brand") ?? undefined,
    commercialModel: params.get("commercialModel") ?? undefined,
    productName: params.get("productName") ?? undefined,
    color: params.get("color") ?? undefined,
    compatibility: params.get("compatibility") ?? undefined,
    accessoryVariant: params.get("accessoryVariant") ?? undefined
  });
  return NextResponse.json(rows);
}
