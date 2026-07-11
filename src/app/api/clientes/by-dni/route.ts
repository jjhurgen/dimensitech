import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const dni = url.searchParams.get("dni") ?? url.searchParams.get("documentNumber") ?? "";
  const documentType = url.searchParams.get("documentType") ?? undefined;
  const customer = await prisma.customer.findFirst({
    where: {
      dni,
      ...(documentType ? { documentType: documentType as any } : {})
    }
  });
  return NextResponse.json(customer);
}
