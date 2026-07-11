import { PrismaClient } from "@prisma/client";

export async function nextCode(
  tx: PrismaClient | any,
  model: "purchase" | "sale" | "reservation",
  field: "purchaseCode" | "saleCode" | "reservationCode",
  prefix: string
) {
  const latest = await tx[model].findFirst({
    orderBy: { id: "desc" },
    select: { [field]: true }
  });
  const raw = latest?.[field] as string | undefined;
  const number = raw ? Number(raw.split("-")[1] ?? 0) + 1 : 1;
  return `${prefix}-${String(number).padStart(6, "0")}`;
}
