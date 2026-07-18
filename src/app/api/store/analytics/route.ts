import { randomUUID, createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const sessionCookieName = "dtech_analytics_session";
const allowedEventTypes = new Set(["page_view", "product_view", "product_click", "add_to_cart", "heartbeat"]);
const ignoredPathPrefixes = ["/admin", "/api", "/login", "/cambiar-contrasena"];

function trimText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

function normalizePath(value: unknown) {
  const path = trimText(value, 500);
  if (!path) return "/";

  try {
    if (path.startsWith("http://") || path.startsWith("https://")) {
      const url = new URL(path);
      return `${url.pathname}${url.search}`.slice(0, 500) || "/";
    }
  } catch {
    return "/";
  }

  return path.startsWith("/") ? path : `/${path}`;
}

function shouldIgnorePath(path: string) {
  return ignoredPathPrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

function clientIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown"
  );
}

function visitorHash(request: NextRequest, userAgent: string | null) {
  const secret = process.env.ANALYTICS_HASH_SECRET || process.env.NEXTAUTH_SECRET || "dimensitech-store";
  return createHash("sha256")
    .update(`${secret}:${clientIp(request)}:${userAgent ?? ""}`)
    .digest("hex");
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const eventType = trimText(body.eventType, 40) ?? "";
  if (!allowedEventTypes.has(eventType)) return NextResponse.json({ ok: false }, { status: 400 });

  const path = normalizePath(body.path);
  if (shouldIgnorePath(path)) return NextResponse.json({ ok: true });

  const productSkuIdValue = Number(body.productSkuId);
  const productSkuId = Number.isInteger(productSkuIdValue) && productSkuIdValue > 0 ? productSkuIdValue : null;
  const userAgent = trimText(request.headers.get("user-agent"), 500);
  const referrer = trimText(request.headers.get("referer"), 500);
  const sessionId = request.cookies.get(sessionCookieName)?.value || randomUUID();
  const hash = visitorHash(request, userAgent);

  await prisma.$transaction([
    prisma.$executeRaw`
      INSERT INTO web_analytics_sessions (
        session_id,
        visitor_hash,
        first_seen_at,
        last_seen_at,
        current_path,
        current_product_sku_id,
        referrer,
        user_agent
      )
      VALUES (${sessionId}, ${hash}, NOW(3), NOW(3), ${path}, ${productSkuId}, ${referrer}, ${userAgent})
      ON DUPLICATE KEY UPDATE
        visitor_hash = VALUES(visitor_hash),
        last_seen_at = NOW(3),
        current_path = VALUES(current_path),
        current_product_sku_id = VALUES(current_product_sku_id),
        referrer = COALESCE(VALUES(referrer), referrer),
        user_agent = VALUES(user_agent)
    `,
    ...(eventType === "heartbeat"
      ? []
      : [
          prisma.$executeRaw`
            INSERT INTO web_analytics_events (
              event_type,
              session_id,
              visitor_hash,
              path,
              product_sku_id,
              referrer,
              user_agent,
              created_at
            )
            VALUES (${eventType}, ${sessionId}, ${hash}, ${path}, ${productSkuId}, ${referrer}, ${userAgent}, NOW(3))
          `
        ])
  ]);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookieName, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/"
  });

  return response;
}
