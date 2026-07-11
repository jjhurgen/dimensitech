import { prisma } from "@/lib/prisma";

export async function findImageSuggestions(input: {
  productTypeId?: number;
  isPhone?: boolean;
  brand?: string;
  commercialModel?: string;
  productName?: string;
  color?: string;
  compatibility?: string;
  accessoryVariant?: string;
}) {
  if (input.isPhone) {
    return prisma.productImageLibrary.findMany({
      where: {
        isActive: true,
        brand: input.brand,
        commercialModel: input.commercialModel ?? input.productName,
        color: input.color
      },
      take: 8,
      orderBy: { updatedAt: "desc" }
    });
  }

  return prisma.productImageLibrary.findMany({
    where: {
      isActive: true,
      productTypeId: input.productTypeId,
      OR: [
        { productName: { contains: input.productName ?? "" } },
        { compatibility: { contains: input.compatibility ?? "" } },
        { color: input.color },
        { accessoryVariant: { contains: input.accessoryVariant ?? "" } }
      ]
    },
    take: 12,
    orderBy: { updatedAt: "desc" }
  });
}
