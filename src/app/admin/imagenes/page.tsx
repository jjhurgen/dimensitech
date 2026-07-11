import { saveImageLibrary } from "./actions";
import { ImageLibraryManager } from "./image-library-manager";
import { AdminModal } from "@/components/admin/admin-modal";
import { Field, ModalActions, ModalFormGrid, ModalSection } from "@/components/admin/modal-form";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { prisma } from "@/lib/prisma";

export default async function ImagesPage() {
  const [products, images] = await Promise.all([
    prisma.productSku.findMany({ include: { image: true, productType: true }, orderBy: [{ brand: "asc" }, { name: "asc" }] }),
    prisma.productImageLibrary.findMany({ include: { productType: true, skus: true }, orderBy: { id: "desc" }, take: 120 })
  ]);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Imagenes de productos</h1>
          <p className="text-sm text-slate-500">Asigna imagenes a tus SKUs o sube nuevas referencias desde tu computadora.</p>
        </div>
        <AdminModal title="Subir imagen" triggerLabel="Subir imagen" description="Carga una imagen local y opcionalmente asignala de inmediato a un producto.">
          <form action={saveImageLibrary} className="space-y-4">
            <ModalSection title="Imagen y asignacion" description="El nombre del modelo sirve para identificar la imagen en la lista.">
              <ModalFormGrid>
                <Field label="Producto">
                  <Select name="productSkuId">
                    <option value="">Solo guardar en biblioteca</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>{product.skuCode} - {product.brand} {product.name} {product.color ?? ""} {product.storage ?? ""}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Nombre del modelo">
                  <Input name="modelName" placeholder="iPhone 15 Pro Max Natural" required />
                </Field>
                <Field label="Archivo" hint="JPG, PNG, WEBP o AVIF." className="md:col-span-2">
                  <Input name="imageFile" type="file" accept="image/png,image/jpeg,image/webp,image/avif" required />
                </Field>
              </ModalFormGrid>
            </ModalSection>

            <ModalActions>
              <Button>Guardar imagen</Button>
            </ModalActions>
          </form>
        </AdminModal>
      </div>

      <ImageLibraryManager
        products={products.map((product) => ({
          id: product.id,
          skuCode: product.skuCode,
          brand: product.brand,
          name: product.name,
          color: product.color,
          storage: product.storage,
          imageId: product.imageId,
          imageUrl: product.image?.imageUrl ?? null,
          assignedImageName: product.image?.productName ?? null,
          productTypeName: product.productType.name
        }))}
        images={images.map((image) => ({
          id: image.id,
          productName: image.productName,
          brand: image.brand,
          commercialModel: image.commercialModel,
          color: image.color,
          imageUrl: image.imageUrl,
          altText: image.altText,
          assignedCount: image.skus.length
        }))}
      />
    </div>
  );
}
