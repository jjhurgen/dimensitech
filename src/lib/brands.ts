import { prisma } from "@/lib/prisma";

export type BrandOption = { id: number; name: string; status?: "ACTIVE" | "INACTIVE" };

const fallbackBrands: BrandOption[] = [
  "Apple",
  "Samsung",
  "Xiaomi",
  "Redmi",
  "Honor",
  "Infinix",
  "Motorola",
  "Huawei",
  "Lenovo",
  "Otros"
].map((name, index) => ({ id: -(index + 1), name, status: "ACTIVE" }));

export async function activeBrands() {
  try {
    return await prisma.$queryRaw<BrandOption[]>`SELECT id, name, status FROM brands WHERE status = 'ACTIVE' ORDER BY name ASC`;
  } catch {
    return fallbackBrands;
  }
}

export async function allBrands() {
  try {
    return await prisma.$queryRaw<BrandOption[]>`SELECT id, name, status FROM brands ORDER BY name ASC`;
  } catch {
    return fallbackBrands;
  }
}
