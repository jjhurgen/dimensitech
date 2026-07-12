import { mkdir, readFile, stat, writeFile } from "fs/promises";
import path from "path";

export type UploadFolder = "products" | "banners";

const publicUploadsRoot = path.join(process.cwd(), "public", "uploads");

export function uploadsRoot() {
  const configuredRoot = process.env.UPLOADS_DIR?.trim();
  return configuredRoot ? path.resolve(configuredRoot) : publicUploadsRoot;
}

export function publicUploadsFallbackRoot() {
  return publicUploadsRoot;
}

export async function writeUploadFile(folder: UploadFolder, fileName: string, data: Buffer) {
  const targetDir = path.join(uploadsRoot(), folder);
  await mkdir(targetDir, { recursive: true });
  await writeFile(path.join(targetDir, fileName), data);
}

export async function readUploadFile(segments: string[]) {
  const targetFromPersistent = safeUploadPath(uploadsRoot(), segments);
  const persistentFile = await readIfFile(targetFromPersistent);
  if (persistentFile) return persistentFile;

  const targetFromPublic = safeUploadPath(publicUploadsFallbackRoot(), segments);
  return readIfFile(targetFromPublic);
}

function safeUploadPath(root: string, segments: string[]) {
  if (!segments.length || segments.some((segment) => !segment || segment === "." || segment === "..")) {
    throw new Error("Ruta de archivo no permitida");
  }

  const targetPath = path.resolve(root, ...segments);
  const relativePath = path.relative(root, targetPath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error("Ruta de archivo no permitida");
  }

  return targetPath;
}

async function readIfFile(filePath: string) {
  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) return null;
    return readFile(filePath);
  } catch {
    return null;
  }
}
