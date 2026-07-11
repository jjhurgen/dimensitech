"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function changeInitialPasswordAction(formData: FormData) {
  const user = await requireUser();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (password.length < 8 || password !== confirmPassword) redirect("/cambiar-contrasena?error=1");

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: await bcrypt.hash(password, 10),
      mustChangePassword: false
    }
  });

  redirect("/admin");
}
