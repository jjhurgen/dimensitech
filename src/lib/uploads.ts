import { randomUUID } from "crypto";
import { writeUploadFile } from "@/lib/upload-storage";

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const maxImageSize = 10 * 1024 * 1024;

export async function saveProductImageUpload(file: File) {
  return saveImageUpload(file, "products");
}

export async function saveBannerImageUpload(file: File) {
  return saveImageUpload(file, "banners");
}

async function saveImageUpload(file: File, folder: "products" | "banners") {
  if (!file || file.size === 0) return null;
  if (!allowedImageTypes.has(file.type)) throw new Error("Formato de imagen no permitido");
  if (file.size > maxImageSize) throw new Error("La imagen no debe superar los 10 MB");

  const extension = extensionForType(file.type);
  const fileName = `${randomUUID()}.${extension}`;
  const relativePath = `/uploads/${folder}/${fileName}`;

  await writeUploadFile(folder, fileName, Buffer.from(await file.arrayBuffer()));

  return relativePath;
}

function extensionForType(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/avif") return "avif";
  return "jpg";
}
