import { NextResponse } from "next/server";
import { readUploadFile } from "@/lib/upload-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const contentTypes: Record<string, string> = {
  avif: "image/avif",
  gif: "image/gif",
  ico: "image/x-icon",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  svg: "image/svg+xml",
  webp: "image/webp"
};

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;

  try {
    const file = await readUploadFile(path);
    if (!file) return new NextResponse("Archivo no encontrado", { status: 404 });

    const extension = path.at(-1)?.split(".").pop()?.toLowerCase() ?? "";
    const contentType = contentTypes[extension] ?? "application/octet-stream";

    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff"
      }
    });
  } catch {
    return new NextResponse("Ruta de archivo no permitida", { status: 400 });
  }
}
