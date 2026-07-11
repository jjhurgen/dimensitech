"use server";

import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const roles = new Set<UserRole>(["ADMIN", "SELLER", "WAREHOUSE"]);

async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new Error("Solo un administrador puede gestionar usuarios");
  return user;
}

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function parseBirthDate(value: string) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function fullName(firstNames: string, lastNames: string) {
  return `${firstNames} ${lastNames}`.replace(/\s+/g, " ").trim();
}

export async function createUserAction(formData: FormData) {
  await requireAdmin();
  const dni = text(formData, "dni");
  const firstNames = text(formData, "firstNames");
  const lastNames = text(formData, "lastNames");
  const role = text(formData, "role") as UserRole;

  if (!/^\d{8,12}$/.test(dni)) throw new Error("Ingrese un DNI valido");
  if (!firstNames || !lastNames || !roles.has(role)) throw new Error("Datos de usuario incompletos");

  await prisma.user.create({
    data: {
      dni,
      firstNames,
      lastNames,
      name: fullName(firstNames, lastNames),
      email: `${dni}@usuarios.local`,
      birthDate: parseBirthDate(text(formData, "birthDate")),
      address: text(formData, "address") || null,
      phone: text(formData, "phone") || null,
      role,
      password: await bcrypt.hash(dni, 10),
      mustChangePassword: true
    }
  });

  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios");
}

export async function updateUserAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("userId"));
  const dni = text(formData, "dni");
  const firstNames = text(formData, "firstNames");
  const lastNames = text(formData, "lastNames");
  const role = text(formData, "role") as UserRole;

  if (!id || !/^\d{8,12}$/.test(dni)) throw new Error("Usuario o DNI invalido");
  if (!firstNames || !lastNames || !roles.has(role)) throw new Error("Datos de usuario incompletos");

  await prisma.user.update({
    where: { id },
    data: {
      dni,
      firstNames,
      lastNames,
      name: fullName(firstNames, lastNames),
      email: `${dni}@usuarios.local`,
      birthDate: parseBirthDate(text(formData, "birthDate")),
      address: text(formData, "address") || null,
      phone: text(formData, "phone") || null,
      role
    }
  });

  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios");
}

export async function toggleUserAction(formData: FormData) {
  const current = await requireAdmin();
  const id = Number(formData.get("userId"));
  const isActive = String(formData.get("isActive")) === "true";
  if (!id) throw new Error("Usuario invalido");
  if (id === current.id && !isActive) throw new Error("No puedes desactivar tu propio usuario");

  await prisma.user.update({
    where: { id },
    data: {
      isActive,
      deactivatedAt: isActive ? null : new Date()
    }
  });

  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios");
}

export async function resetUserPasswordAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("userId"));
  if (!id) throw new Error("Usuario invalido");

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user?.dni) throw new Error("El usuario no tiene DNI configurado");

  await prisma.user.update({
    where: { id },
    data: {
      password: await bcrypt.hash(user.dni, 10),
      mustChangePassword: true
    }
  });

  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios");
}
