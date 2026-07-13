"use client";

import { useMemo, useState } from "react";
import { saveProductSku } from "./actions";
import { CheckboxField, Field, ModalActions, ModalFormGrid, ModalSection } from "@/components/admin/modal-form";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { productConditionOptions } from "@/lib/product-condition";
import { ColorCombobox } from "./color-combobox";

type TypeOption = { id: number; name: string; requiresImei: boolean };
type ImageOption = { id: number; productName: string; brand: string | null; color: string | null };
type BrandOption = { id: number; name: string };

export function ProductSkuForm({
  types,
  images,
  brands,
  product
}: {
  types: TypeOption[];
  images: ImageOption[];
  brands: BrandOption[];
  product?: any;
}) {
  const [productTypeId, setProductTypeId] = useState(String(product?.productTypeId ?? types[0]?.id ?? ""));
  const selectedType = useMemo(() => types.find((type) => String(type.id) === productTypeId), [productTypeId, types]);
  const isPhone = !!selectedType?.requiresImei;

  return (
    <form action={saveProductSku} className="space-y-4">
      {product ? <input type="hidden" name="id" value={product.id} /> : null}
      <ModalSection title="Datos principales" description="Campos requeridos para crear o editar el SKU comercial.">
        <ModalFormGrid className="lg:grid-cols-3">
          <Field label="Codigo interno">
            <Input name="skuCode" placeholder="SKU-0001" required defaultValue={product?.skuCode ?? ""} />
          </Field>
          <Field label="Tipo">
            <Select name="productTypeId" value={productTypeId} onChange={(event) => setProductTypeId(event.target.value)}>
              {types.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
            </Select>
          </Field>
          <Field label="Marca">
            <Select name="brand" required defaultValue={product?.brand ?? ""}>
              <option value="">Seleccionar marca</option>
              {brands.map((brand) => <option key={brand.id} value={brand.name}>{brand.name}</option>)}
            </Select>
          </Field>
          <Field label="Nombre del producto">
            <Input name="name" placeholder={isPhone ? "iPhone 15 Pro Max" : "Cubo Apple 20W"} required defaultValue={product?.name ?? ""} />
          </Field>
          <Field label="Color">
            <ColorCombobox defaultValue={product?.color ?? ""} />
          </Field>
          <Field label="Imagen de biblioteca">
            <Select name="imageId" defaultValue={product?.imageId ?? ""}>
              <option value="">Sin imagen asignada</option>
              {images.map((img) => <option key={img.id} value={img.id}>{img.productName} {img.brand ?? ""} {img.color ?? ""}</option>)}
            </Select>
          </Field>
        </ModalFormGrid>
      </ModalSection>

      <ModalSection title="Imagen desde equipo" description="Opcional. Si subes una imagen, se guarda en biblioteca y queda asignada a este SKU.">
        <ModalFormGrid>
          <Field label="Nombre del modelo">
            <Input name="imageModelName" placeholder="Nombre para identificar la imagen" defaultValue={product?.commercialModel ?? product?.name ?? ""} />
          </Field>
          <Field label="Archivo de imagen">
            <Input name="imageFile" type="file" accept="image/png,image/jpeg,image/webp,image/avif" />
          </Field>
        </ModalFormGrid>
      </ModalSection>

      {isPhone ? (
        <ModalSection title="Especificaciones de celular" description="Estos campos solo aplican cuando el tipo seleccionado requiere IMEI.">
          <ModalFormGrid className="lg:grid-cols-3">
            <Field label="Almacenamiento">
              <Input name="storage" placeholder="128GB" defaultValue={product?.storage ?? ""} />
            </Field>
            <Field label="RAM">
              <Input name="ram" placeholder="8GB" defaultValue={product?.ram ?? ""} />
            </Field>
            <Field label="Plataforma">
              <Select name="platform" defaultValue={product?.platform ?? ""}><option value="">Plataforma</option><option value="ANDROID">Android</option><option value="IPHONE">iPhone</option></Select>
            </Field>
            <Field label="Modelo comercial" className="lg:col-span-3">
              <Input name="commercialModel" placeholder="iPhone 15 Pro Max" defaultValue={product?.commercialModel ?? ""} />
            </Field>
          </ModalFormGrid>
        </ModalSection>
      ) : (
        <>
          <input type="hidden" name="storage" value="" />
          <input type="hidden" name="ram" value="" />
          <input type="hidden" name="platform" value="" />
          <input type="hidden" name="commercialModel" value={product?.commercialModel ?? ""} />
        </>
      )}

      <ModalSection title="Web y estado">
        <ModalFormGrid className="lg:grid-cols-3">
          <Field label="Precio sugerido">
            <Input name="suggestedSalePrice" type="number" step="0.01" placeholder="0.00" required defaultValue={product?.suggestedSalePrice ? String(product.suggestedSalePrice) : ""} />
          </Field>
          <Field label="Condicion">
            <Select name="condition" defaultValue={product?.condition ?? "NEW_SEALED"}>
              {productConditionOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </Select>
          </Field>
          <Field label="Visible en web">
            <CheckboxField><input name="visibleInStore" type="checkbox" className="h-4 w-4 rounded border-slate-300" defaultChecked={product?.visibleInStore ?? false} /> Visible en tienda</CheckboxField>
          </Field>
          <Field label="Venta a pedido">
            <CheckboxField><input name="availableOnRequest" type="checkbox" className="h-4 w-4 rounded border-slate-300" defaultChecked={product?.availableOnRequest ?? false} /> Mostrar como a pedido si no hay stock</CheckboxField>
          </Field>
          <Field label="Dias de llegada">
            <Input name="requestDeliveryDays" type="number" min="1" max="30" step="1" placeholder="1" defaultValue={product?.requestDeliveryDays ?? 1} />
          </Field>
          <Field label="Estado">
            <Select name="status" defaultValue={product?.status ?? "ACTIVE"}><option value="ACTIVE">Activo</option><option value="INACTIVE">Inactivo</option></Select>
          </Field>
          <Field label="Descripcion corta" className="lg:col-span-3">
            <Textarea name="shortDescription" placeholder="Descripcion breve para tienda y ventas" defaultValue={product?.shortDescription ?? ""} />
          </Field>
        </ModalFormGrid>
      </ModalSection>

      <input type="hidden" name="modelNumber" value={product?.modelNumber ?? ""} />

      <ModalActions>
        <Button>{product ? "Guardar cambios" : "Guardar SKU"}</Button>
      </ModalActions>
    </form>
  );
}
