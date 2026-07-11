import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `Falta configurar la variable de entorno obligatoria: ${name}`
    );
  }

  return value;
}

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
    ["Otro", false, 3],
  ] as const;

  for (const [name, requiresImei, defaultMinStock] of productTypes) {
    await prisma.productType.upsert({
      where: { name },
      update: {
        requiresImei,
        defaultMinStock,
      },
      create: {
        name,
        requiresImei,
        defaultMinStock,
      },
    });
  }

  const brands = [
    "Apple",
    "Samsung",
    "Xiaomi",
    "Redmi",
    "Honor",
    "Infinix",
    "Motorola",
    "Huawei",
    "Lenovo",
    "Otros",
  ];

  for (const name of brands) {
    await prisma.$executeRaw`
      INSERT INTO brands (name, status, created_at, updated_at)
      VALUES (${name}, 'ACTIVE', NOW(3), NOW(3))
      ON DUPLICATE KEY UPDATE
        status = 'ACTIVE',
        updated_at = NOW(3)
    `;
  }

  /*
   * Administrador inicial
   * Las credenciales deben configurarse mediante variables de entorno.
   * Nunca deben escribirse directamente dentro del repositorio.
   */
  const adminEmail = getRequiredEnv("ADMIN_EMAIL").toLowerCase();
  const adminPassword = getRequiredEnv("ADMIN_PASSWORD");

  if (adminPassword.length < 12) {
    throw new Error(
      "ADMIN_PASSWORD debe contener como mínimo 12 caracteres."
    );
  }

  const hashedAdminPassword = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: {
      email: adminEmail,
    },
    update: {
      name: "Administrador",
      password: hashedAdminPassword,
      role: UserRole.ADMIN,
    },
    create: {
      name: "Administrador",
      email: adminEmail,
      password: hashedAdminPassword,
      role: UserRole.ADMIN,
    },
  });

  await prisma.setting.upsert({
    where: {
      key: "reservation_expiration_hours",
    },
    update: {
      value: "24",
    },
    create: {
      key: "reservation_expiration_hours",
      value: "24",
    },
  });

  await prisma.setting.upsert({
    where: {
      key: "reservation_expiration_minutes",
    },
    update: {
      value: "1440",
    },
    create: {
      key: "reservation_expiration_minutes",
      value: "1440",
    },
  });

  console.log("Seed ejecutado correctamente.");
  console.log(`Administrador configurado: ${adminEmail}`);
}

main()
  .catch((error: unknown) => {
    console.error("Error al ejecutar el seed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });