"use server";

import { redirect } from "next/navigation";
import { login, logout } from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const user = await login(String(formData.get("email")), String(formData.get("password")));
  if (!user) redirect("/login?error=1");
  if (user.mustChangePassword) redirect("/cambiar-contrasena");
  redirect("/admin");
}

export async function logoutAction() {
  await logout();
  redirect("/login");
}
