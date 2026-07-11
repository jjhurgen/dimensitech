import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const productTypes = [
    ["Celular", true, 1],
    ["Cubo", false, 3],
    ["Cable", false, 3],
    ["Case", false, 3],
    ["Mica", false, 3],
    ["Audifono", false, 3],
    ["Cargador", false, 3],
    ["Smartwatch", false, 3],
    ["Laptop", false, 3],
    ["Otro", false, 3]
  ] as const;

  for (const [name, requiresImei, defaultMinStock] of productTypes) {
    await prisma.productType.upsert({
      where: { name },
      update: { requiresImei, defaultMinStock },
      create: { name, requiresImei, defaultMinStock }
    });
  }

  for (const name of ["Apple", "Samsung", "Xiaomi", "Redmi", "Honor", "Infinix", "Motorola", "Huawei", "Lenovo", "Otros"]) {
    await prisma.$executeRaw`
      INSERT INTO brands (name, status, created_at, updated_at)
      VALUES (${name}, 'ACTIVE', NOW(3), NOW(3))
      ON DUPLICATE KEY UPDATE status = 'ACTIVE', updated_at = NOW(3)
    `;
  }

  await prisma.user.upsert({
    where: { email: "admin@dimensitech.store" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@dimensitech.store",
      password: await bcrypt.hash("Admin12345", 10),
      role: UserRole.ADMIN
    }
  });

  await prisma.setting.upsert({
    where: { key: "reservation_expiration_hours" },
    update: { value: "24" },
    create: { key: "reservation_expiration_hours", value: "24" }
  });

  await prisma.setting.upsert({
    where: { key: "reservation_expiration_minutes" },
    update: { value: "1440" },
    create: { key: "reservation_expiration_minutes", value: "1440" }
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
