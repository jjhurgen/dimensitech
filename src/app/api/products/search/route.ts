import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  const rows = await prisma.productSku.findMany({
    where: { OR: [{ skuCode: { contains: q } }, { name: { contains: q } }, { brand: { contains: q } }, { commercialModel: { contains: q } }] },
    include: { productType: true, image: true },
    take: 10
  });
  return NextResponse.json(rows);
}
