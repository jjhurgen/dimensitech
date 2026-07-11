"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Plus, Search, Trash2, X } from "lucide-react";
import { registerPurchaseAction } from "./actions";
import { ProductSkuForm } from "@/app/admin/productos/product-sku-form";
import { AdminModal } from "@/components/admin/admin-modal";
import { Field, ModalActions, ModalFormGrid, ModalSection } from "@/components/admin/modal-form";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";

type ProviderOption = { id: number; name: string };
type ProductOption = {
  id: number;
  skuCode: string;
  brand: string;
  name: string;
  color: string | null;
  storage: string | null;
  ram: string | null;
  platform: string | null;
  modelNumber: string | null;
  productType: { name: string; requiresImei: boolean };
};
type TypeOption = { id: number; name: string; requiresImei: boolean };
type BrandOption = { id: number; name: string };
type ImageOption = { id: number; productName: string; brand: string | null; color: string | null };

type PurchaseLine = {
  key: string;
  productSkuId: string;
  quantity: number;
  unitPurchasePrice: string;
  phones: PhoneLine[];
};

type PhoneLine = {
  imei1: string;
  imei2: string;
  serialNumber: string;
  modelNumber: string;
  modelNumber2: string;
  whiteListRegistered: boolean;
};

function emptyPhone(): PhoneLine {
  return { imei1: "", imei2: "", serialNumber: "", modelNumber: "", modelNumber2: "", whiteListRegistered: false };
}

function emptyLine(): PurchaseLine {
  return {
    key: crypto.randomUUID(),
    productSkuId: "",
    quantity: 1,
    unitPurchasePrice: "",
    phones: [emptyPhone()]
  };
}

export function PurchaseForm({
  providers,
  products,
  types,
  brands,
  images,
  today
}: {
  providers: ProviderOption[];
  products: ProductOption[];
  types: TypeOption[];
  brands: BrandOption[];
  images: ImageOption[];
  today: string;
}) {
  const [lines, setLines] = useState<PurchaseLine[]>([emptyLine()]);
  const productById = useMemo(() => new Map(products.map((product) => [String(product.id), product])), [products]);

  function selectedProduct(line: PurchaseLine) {
    return productById.get(line.productSkuId);
  }

  function updateLine(key: string, next: Partial<PurchaseLine>) {
    setLines((current) => current.map((line) => (line.key === key ? { ...line, ...next } : line)));
  }

  function setQuantity(line: PurchaseLine, quantity: number) {
    const nextQuantity = Math.max(1, quantity || 1);
    const product = selectedProduct(line);
    const phones = product?.productType.requiresImei
      ? Array.from({ length: nextQuantity }, (_, index) => line.phones[index] ?? emptyPhone())
      : [];
    updateLine(line.key, { quantity: nextQuantity, phones });
  }

  function setProduct(line: PurchaseLine, productSkuId: string) {
    const product = productById.get(productSkuId);
    updateLine(line.key, {
      productSkuId,
      phones: product?.productType.requiresImei
        ? Array.from({ length: line.quantity }, (_, index) => line.phones[index] ?? emptyPhone())
        : []
    });
  }

  function updatePhone(lineKey: string, index: number, next: Partial<PhoneLine>) {
    setLines((current) =>
      current.map((line) => {
        if (line.key !== lineKey) return line;
        const phones = [...line.phones];
        phones[index] = { ...(phones[index] ?? emptyPhone()), ...next };
        return { ...line, phones };
      })
    );
  }

  const items = lines
    .filter((line) => line.productSkuId)
    .map((line) => ({
      productSkuId: Number(line.productSkuId),
      quantity: line.quantity,
      unitPurchasePrice: Number(line.unitPurchasePrice || 0),
      phones: selectedProduct(line)?.productType.requiresImei ? line.phones : undefined
    }));

  return (
    <>
    <div className="mb-4 flex justify-end">
      <AdminModal title="Agregar producto sin salir de compra" triggerLabel="Agregar producto nuevo" triggerVariant="secondary" description="Crea el SKU y luego vuelve a abrir Registrar compra para seleccionarlo.">
        <ProductSkuForm types={types} brands={brands} images={images} />
      </AdminModal>
    </div>
    <form action={registerPurchaseAction} className="space-y-4">
      <input type="hidden" name="items" value={JSON.stringify(items)} />

      <ModalSection title="Datos de la compra" description="Informacion del proveedor y costos generales del documento.">
        <ModalFormGrid>
          <Field label="Proveedor">
            <Select name="providerId" required>
              <option value="">Seleccionar proveedor</option>
              {providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name}</option>)}
            </Select>
          </Field>
          <Field label="Fecha de compra">
            <Input name="purchaseDate" type="date" defaultValue={today} required />
          </Field>
          <Field label="Flete" hint="Se prorratea entre todas las unidades.">
            <Input name="freightAmount" type="number" step="0.01" placeholder="0.00" defaultValue="0" />
          </Field>
          <Field label="Notas">
            <Input name="notes" placeholder="Factura, guia o comentario interno" />
          </Field>
        </ModalFormGrid>
      </ModalSection>

      <ModalSection title="Productos comprados" description="Agrega celulares o accesorios. El sistema solo pedira IMEI cuando el producto lo requiera.">
        <div className="space-y-4">
          {lines.map((line, lineIndex) => {
            const product = selectedProduct(line);
            const requiresImei = !!product?.productType.requiresImei;
            const isIphone = requiresImei && product?.platform === "IPHONE";
            return (
              <div key={line.key} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-slate-950">Item {lineIndex + 1}</p>
                    <p className="text-xs font-medium text-slate-500">{requiresImei ? "Celular con control por IMEI" : product ? "Accesorio con control por cantidad" : "Seleccione un producto"}</p>
                  </div>
                  {lines.length > 1 ? (
                    <button type="button" onClick={() => setLines((current) => current.filter((item) => item.key !== line.key))} className="grid h-9 w-9 place-items-center rounded-lg border border-red-100 text-red-600 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>

                <ModalFormGrid className="lg:grid-cols-4">
                  <Field label="Producto / SKU" className="lg:col-span-2">
                    <ProductPicker products={products} value={line.productSkuId} onChange={(value) => setProduct(line, value)} />
                  </Field>
                  <Field label="Cantidad">
                    <Input value={line.quantity} onChange={(event) => setQuantity(line, Number(event.target.value))} type="number" min="1" step="1" required />
                  </Field>
                  <Field label="Costo unitario">
                    <Input value={line.unitPurchasePrice} onChange={(event) => updateLine(line.key, { unitPurchasePrice: event.target.value })} type="number" min="0" step="0.01" placeholder="0.00" required />
                  </Field>
                </ModalFormGrid>

                {requiresImei ? (
                  <div className="mt-4 space-y-3">
                    <div className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">
                      {isIphone
                        ? `Este producto requiere ${line.quantity} IMEI 1. IMEI 2, serie y modelos son opcionales para iPhone.`
                        : `Este producto requiere ${line.quantity} IMEI 1. IMEI 2 y lista blanca.`}
                    </div>
                    {line.phones.map((phone, phoneIndex) => (
                      <div key={`${line.key}-${phoneIndex}`} className={`grid gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3 ${isIphone ? "lg:grid-cols-6" : "lg:grid-cols-3"}`}>
                        <Field label={`IMEI 1 #${phoneIndex + 1}`}>
                          <Input value={phone.imei1} onChange={(event) => updatePhone(line.key, phoneIndex, { imei1: event.target.value })} placeholder="IMEI obligatorio" required />
                        </Field>
                        <Field label="IMEI 2">
                          <Input value={phone.imei2} onChange={(event) => updatePhone(line.key, phoneIndex, { imei2: event.target.value })} placeholder="IMEI obligatorio" required />
                        </Field>
                        {isIphone ? (
                          <>
                            <Field label="Serie">
                              <Input value={phone.serialNumber} onChange={(event) => updatePhone(line.key, phoneIndex, { serialNumber: event.target.value })} placeholder="Opcional" />
                            </Field>
                            <Field label="Modelo 1">
                              <Input value={phone.modelNumber} onChange={(event) => updatePhone(line.key, phoneIndex, { modelNumber: event.target.value })} placeholder={product?.modelNumber ?? "Opcional"} />
                            </Field>
                            <Field label="Modelo 2">
                              <Input value={phone.modelNumber2} onChange={(event) => updatePhone(line.key, phoneIndex, { modelNumber2: event.target.value })} placeholder="Opcional" />
                            </Field>
                          </>
                        ) : null}
                        <Field label="Lista blanca">
                          <label className="flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700">
                            <input
                              checked={phone.whiteListRegistered}
                              onChange={(event) => updatePhone(line.key, phoneIndex, { whiteListRegistered: event.target.checked })}
                              type="checkbox"
                              className="h-4 w-4 rounded border-slate-300"
                            />
                            Registrado
                          </label>
                        </Field>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}

          <button type="button" onClick={() => setLines((current) => [...current, emptyLine()])} className="inline-flex h-11 items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 text-sm font-bold text-blue-700 hover:bg-blue-100">
            <Plus className="h-4 w-4" />
            Agregar otro producto
          </button>
        </div>
      </ModalSection>

      <ModalActions>
        <Button>Registrar compra</Button>
      </ModalActions>
    </form>
    </>
  );
}

function ProductPicker({
  products,
  value,
  onChange
}: {
  products: ProductOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const selected = products.find((product) => String(product.id) === value);
  const filtered = products.filter((product) => {
    const haystack = `${product.skuCode} ${product.brand} ${product.name} ${product.color ?? ""} ${product.storage ?? ""} ${product.productType.name}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  }).slice(0, 60);

  function productLabel(product: ProductOption) {
    return `${product.skuCode} - ${product.brand} ${product.name} ${product.color ?? ""} ${product.storage ?? ""} (${product.productType.name})`;
  }

  function selectProduct(product: ProductOption) {
    onChange(String(product.id));
    setQuery("");
    setOpen(false);
  }

  return (
    <div className="relative">
      <input type="hidden" value={value} required />
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={open ? query : selected ? productLabel(selected) : ""}
          onFocus={() => {
            setOpen(true);
            setQuery("");
          }}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && open && filtered[0]) {
              event.preventDefault();
              selectProduct(filtered[0]);
            }
            if (event.key === "Escape") setOpen(false);
          }}
          placeholder="Buscar y seleccionar producto"
          className="pr-16 pl-9"
        />
        {selected ? (
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              onChange("");
              setQuery("");
              setOpen(true);
            }}
            className="absolute right-9 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Limpiar producto"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
        <ChevronsUpDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>

      {open ? (
        <div className="absolute z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-xl">
          {filtered.length ? (
            filtered.map((product) => {
              const isSelected = String(product.id) === value;
              return (
                <button
                  key={product.id}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectProduct(product)}
                  className="flex w-full items-start gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-[#098d8f]/5"
                >
                  <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center">
                    {isSelected ? <Check className="h-4 w-4 text-[#098d8f]" /> : null}
                  </span>
                  <span>
                    <span className="block font-bold text-slate-950">{product.skuCode} - {product.brand} {product.name}</span>
                    <span className="block text-xs text-slate-500">{product.color ?? ""} {product.storage ?? ""} {product.productType.name}</span>
                  </span>
                </button>
              );
            })
          ) : (
            <p className="px-3 py-4 text-sm font-semibold text-slate-500">No hay productos con esa busqueda.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
