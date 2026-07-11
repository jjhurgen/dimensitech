import { NextResponse } from "next/server";
import { findPhoneByImei } from "@/lib/services/sales";

export async function GET(request: Request) {
  const imei = new URL(request.url).searchParams.get("imei") ?? "";
  const phone = imei ? await findPhoneByImei(imei) : null;
  return NextResponse.json(phone);
}
