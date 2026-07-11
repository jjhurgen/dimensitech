import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const cookieName = process.env.AUTH_COOKIE_NAME ?? "dimensitech_session";

async function loginClientMeta() {
  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ipAddress =
    forwardedFor ||
    requestHeaders.get("x-real-ip") ||
    requestHeaders.get("cf-connecting-ip") ||
    requestHeaders.get("true-client-ip") ||
    "local";
  const userAgent = requestHeaders.get("user-agent")?.slice(0, 1000) || "Desconocido";
  return { ipAddress, userAgent };
}

export async function login(identifier: string, password: string) {
  const value = identifier.trim();
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: value },
        { dni: value }
      ]
    }
  });
  if (!user || !user.isActive) return null;
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return null;

  const { ipAddress, userAgent } = await loginClientMeta();
  const lastLoginAt = new Date();
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt, lastLoginIp: ipAddress, lastLoginUserAgent: userAgent }
    }),
    prisma.userLoginEvent.create({
      data: { userId: user.id, ipAddress, userAgent }
    })
  ]);

  const token = Buffer.from(`${user.id}:${Date.now()}`).toString("base64url");
  const jar = await cookies();
  jar.set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 12,
    path: "/"
  });
  return user;
}

export async function logout() {
  const jar = await cookies();
  jar.delete(cookieName);
}

export async function currentUser() {
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;
  if (!token) return null;
  const raw = Buffer.from(token, "base64url").toString("utf8");
  const id = Number(raw.split(":")[0]);
  if (!id) return null;
  return prisma.user.findFirst({
    where: { id, isActive: true },
    select: { id: true, name: true, email: true, dni: true, role: true, mustChangePassword: true }
  });
}

export async function requireUser() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}

export function canAccess(role: string, module: "sales" | "warehouse" | "admin") {
  if (role === "ADMIN") return true;
  if (module === "sales") return role === "SELLER";
  if (module === "warehouse") return role === "WAREHOUSE";
  return false;
}
