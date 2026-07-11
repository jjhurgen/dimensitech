"use client";

import Image from "next/image";
import { ChevronDown, Search, Trash2, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { assignProductImage, deleteImageLibrary } from "./actions";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";

type ProductOption = {
  id: number;
  skuCode: string;
  brand: string;
  name: string;
  color: string | null;
  storage: string | null;
  imageId: number | null;
  imageUrl: string | null;
  assignedImageName: string | null;
  productTypeName: string;
};

type ImageOption = {
  id: number;
  productName: string;
  brand: string | null;
  commercialModel: string | null;
  color: string | null;
  imageUrl: string;
  altText: string | null;
  assignedCount: number;
};

export function ImageLibraryManager({ products, images }: { products: ProductOption[]; images: ImageOption[] }) {
  const grouped = useMemo(() => {
    const map = new Map<string, ProductOption[]>();
    for (const product of products) {
      const list = map.get(product.productTypeName) ?? [];
      list.push(product);
      map.set(product.productTypeName, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [products]);
  const [openTypes, setOpenTypes] = useState<Set<string>>(() => new Set());
  const [queryByType, setQueryByType] = useState<Record<string, string>>({});
  const [imageToDelete, setImageToDelete] = useState<ImageOption | null>(null);

  function toggleType(type: string) {
    setOpenTypes((current) => {
      const next = new Set(current);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4">
          <h2 className="text-lg font-black">Asignar imagen a productos</h2>
          <p className="text-sm text-slate-500">Productos agrupados por tipo. Usa el buscador dentro de cada acordeon para ubicar rapido un SKU.</p>
        </div>
        <div className="divide-y divide-slate-100">
          {grouped.map(([typeName, typeProducts]) => {
            const query = (queryByType[typeName] ?? "").toLowerCase().trim();
            const visibleProducts = typeProducts.filter((product) =>
              [product.skuCode, product.brand, product.name, product.color ?? "", product.storage ?? ""].join(" ").toLowerCase().includes(query)
            );
            const missingCount = typeProducts.filter((product) => !product.imageId).length;
            const isOpen = openTypes.has(typeName);

            return (
              <section key={typeName}>
                <button type="button" onClick={() => toggleType(typeName)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50">
                  <div>
                    <h3 className="font-black text-slate-950">{typeName}</h3>
                    <p className="text-xs text-slate-500">{typeProducts.length} producto(s) {missingCount ? `| ${missingCount} sin imagen` : ""}</p>
                  </div>
                  <ChevronDown className={`h-5 w-5 text-slate-500 transition ${isOpen ? "rotate-180" : ""}`} />
                </button>

                {isOpen ? (
                  <div className="space-y-3 bg-slate-50/60 p-4">
                    <div className="relative max-w-lg">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        value={queryByType[typeName] ?? ""}
                        onChange={(event) => setQueryByType((current) => ({ ...current, [typeName]: event.target.value }))}
                        placeholder={`Buscar en ${typeName}`}
                        className="h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-[#098d8f]"
                      />
                    </div>

                    <div className="grid gap-3">
                      {visibleProducts.map((product) => (
                        <form key={product.id} action={assignProductImage} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3 md:grid-cols-[1fr_260px_120px] md:items-center">
                          <input type="hidden" name="productSkuId" value={product.id} />
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-50">
                              {product.imageUrl ? <Image src={product.imageUrl} alt={product.name} fill sizes="56px" className="object-contain p-1" /> : <div className="grid h-full place-items-center text-[10px] font-black text-slate-400">SIN</div>}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-black text-slate-950">{product.skuCode} - {product.brand} {product.name}</p>
                              <p className="text-xs text-slate-500">{product.color} {product.storage} - {product.assignedImageName ?? "Sin imagen asignada"}</p>
                            </div>
                          </div>
                          <div className="space-y-1">
                            {!product.imageId ? (
                              <div className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">
                                <TriangleAlert className="h-3.5 w-3.5" />
                                Falta imagen
                              </div>
                            ) : null}
                            <Select name="imageId" defaultValue={product.imageId ?? ""} required>
                              <option value="">Seleccionar imagen</option>
                              {images.map((image) => <option key={image.id} value={image.id}>{image.productName} {image.brand ?? ""} {image.color ?? ""}</option>)}
                            </Select>
                          </div>
                          <Button>Asignar</Button>
                        </form>
                      ))}
                      {!visibleProducts.length ? <p className="rounded-lg border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">No hay productos para esta busqueda.</p> : null}
                    </div>
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-3">
          <h2 className="text-lg font-black">Biblioteca de imagenes</h2>
          <p className="text-sm text-slate-500">Elimina referencias que ya no uses. Si estan asignadas, se retiraran de esos productos.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
          {images.map((image) => (
            <div key={image.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="relative aspect-square overflow-hidden rounded-md bg-slate-100">
                <Image src={image.imageUrl} alt={image.altText ?? image.productName} fill sizes="(min-width: 1280px) 20vw, (min-width: 768px) 33vw, 100vw" className="object-cover" />
              </div>
              <p className="mt-3 text-sm font-semibold">{image.productName}</p>
              <p className="text-xs text-slate-500">{image.brand} {image.commercialModel} {image.color}</p>
              <p className="mt-1 text-xs font-bold text-slate-500">{image.assignedCount} producto(s) asignado(s)</p>
              <button type="button" onClick={() => setImageToDelete(image)} className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50">
                <Trash2 className="h-4 w-4" />
                Eliminar
              </button>
            </div>
          ))}
        </div>
      </section>

      {imageToDelete ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl">
            <h2 className="text-lg font-black text-slate-950">Eliminar imagen</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {imageToDelete.assignedCount > 0
                ? `Esta imagen esta asignada a ${imageToDelete.assignedCount} producto(s). Al eliminarla se quitara tambien de esos productos y deberas asignar una nueva imagen.`
                : "Esta imagen no esta asignada a ningun producto."}
            </p>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setImageToDelete(null)} className="h-10 rounded-md border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50">
                Volver
              </button>
              <form action={deleteImageLibrary}>
                <input type="hidden" name="imageId" value={imageToDelete.id} />
                <Button className="bg-slate-700 hover:bg-slate-800">Si, eliminar</Button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
