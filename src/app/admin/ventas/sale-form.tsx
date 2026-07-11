"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import { registerSaleAction } from "./actions";
import { CheckboxField, Field, ModalActions, ModalFormGrid, ModalSection } from "@/components/admin/modal-form";
import { BarcodeScanner } from "@/components/barcode-scanner";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";

type CustomerOption = { id: number; dni: string | null; firstNames: string; lastNames: string };
type ProductOption = {
  id: number;
  skuCode: string;
  brand: string;
  name: string;
  color: string | null;
  storage: string | null;
  suggestedSalePrice: any;
  productType: { name: string; requiresImei: boolean };
};

type SaleLine = {
  key: string;
  itemType: "PHONE" | "ACCESSORY";
  productSkuId: number;
  phoneUnitId?: number | null;
  label: string;
  quantity: number;
  unitSalePrice: string;
  discount: string;
  isGift: boolean;
};

export function SaleForm({
  customers,
  products,
  today
}: {
  customers: CustomerOption[];
  products: ProductOption[];
  today: string;
}) {
  const [lines, setLines] = useState<SaleLine[]>([]);
  const [imei, setImei] = useState("");
  const [accessoryProductId, setAccessoryProductId] = useState("");
  const [accessoryQty, setAccessoryQty] = useState(1);
  const [accessoryGift, setAccessoryGift] = useState(false);
  const [message, setMessage] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [customerDocumentType, setCustomerDocumentType] = useState<"DNI" | "CE" | "RUC">("DNI");
  const [customerDocumentNumber, setCustomerDocumentNumber] = useState("");
  const [customerFullName, setCustomerFullName] = useState("");

  const accessories = useMemo(() => products.filter((product) => !product.productType.requiresImei), [products]);
  const accessoryById = useMemo(() => new Map(accessories.map((product) => [String(product.id), product])), [accessories]);

  useEffect(() => {
    if (customerDocumentType !== "DNI" || customerDocumentNumber.length !== 8) {
      if (customerDocumentType !== "DNI") setCustomerId("");
      return;
    }

    let active = true;
    fetch(`/api/clientes/by-dni?documentType=DNI&documentNumber=${encodeURIComponent(customerDocumentNumber)}`)
      .then((response) => response.json())
      .then((customer) => {
        if (!active) return;
        if (customer?.id) {
          setCustomerId(String(customer.id));
          setCustomerFullName(`${customer.lastNames ?? ""} ${customer.firstNames ?? ""}`.trim());
        } else {
          setCustomerId("");
        }
      })
      .catch(() => {
        if (active) setCustomerId("");
      });

    return () => {
      active = false;
    };
  }, [customerDocumentNumber, customerDocumentType]);

  function documentMaxLength() {
    if (customerDocumentType === "DNI") return 8;
    if (customerDocumentType === "RUC") return 11;
    return 12;
  }

  async function addPhoneByImei() {
    setMessage("");
    const value = imei.trim();
    if (!value) return;
    const response = await fetch(`/api/phones/by-imei?imei=${encodeURIComponent(value)}`);
    const phone = await response.json();
    if (!phone?.id) {
      setMessage("No se encontro un celular con ese IMEI.");
      return;
    }
    if (!["AVAILABLE", "RESERVED"].includes(phone.status)) {
      setMessage(`El celular no esta disponible. Estado actual: ${phone.status}.`);
      return;
    }
    if (lines.some((line) => line.phoneUnitId === phone.id)) {
      setMessage("Ese IMEI ya fue agregado a la venta.");
      return;
    }

    setLines((current) => [
      ...current,
      {
        key: crypto.randomUUID(),
        itemType: "PHONE",
        productSkuId: phone.productSkuId,
        phoneUnitId: phone.id,
        label: `${phone.imei1} - ${phone.productSku.brand} ${phone.productSku.name} ${phone.color ?? ""} ${phone.storage ?? ""}`,
        quantity: 1,
        unitSalePrice: String(phone.productSku.suggestedSalePrice ?? ""),
        discount: "0",
        isGift: false
      }
    ]);
    setImei("");
  }

  function addAccessory() {
    setMessage("");
    const product = accessoryById.get(accessoryProductId);
    if (!product) return;
    setLines((current) => [
      ...current,
      {
        key: crypto.randomUUID(),
        itemType: "ACCESSORY",
        productSkuId: product.id,
        phoneUnitId: null,
        label: `${product.skuCode} - ${product.brand} ${product.name} ${product.color ?? ""}`,
        quantity: Math.max(1, accessoryQty || 1),
        unitSalePrice: accessoryGift ? "0" : String(product.suggestedSalePrice ?? ""),
        discount: "0",
        isGift: accessoryGift
      }
    ]);
    setAccessoryProductId("");
    setAccessoryQty(1);
    setAccessoryGift(false);
  }

  function updateLine(key: string, next: Partial<SaleLine>) {
    setLines((current) => current.map((line) => (line.key === key ? { ...line, ...next } : line)));
  }

  const items = lines.map((line) => ({
    productSkuId: line.productSkuId,
    phoneUnitId: line.phoneUnitId ?? null,
    itemType: line.itemType,
    quantity: line.itemType === "PHONE" ? 1 : line.quantity,
    unitSalePrice: Number(line.unitSalePrice || 0),
    discount: Number(line.discount || 0),
    isGift: line.isGift
  }));

  return (
    <form action={registerSaleAction} className="space-y-4">
      <input type="hidden" name="items" value={JSON.stringify(items)} />
      <input type="hidden" name="customerId" value={customerId} />

      <ModalSection title="Cliente y canal" description="Ingresa el documento del cliente. Si es DNI y ya compro antes, se autocompletara al llegar a 8 digitos.">
        <ModalFormGrid className="lg:grid-cols-4">
          <Field label="Tipo documento">
            <Select
              name="customerDocumentType"
              value={customerDocumentType}
              onChange={(event) => {
                setCustomerDocumentType(event.target.value as "DNI" | "CE" | "RUC");
                setCustomerDocumentNumber("");
                setCustomerId("");
              }}
            >
              <option value="DNI">DNI</option>
              <option value="CE">Carnet de extranjeria</option>
              <option value="RUC">RUC</option>
            </Select>
          </Field>
          <Field label={customerDocumentType === "RUC" ? "RUC" : customerDocumentType === "CE" ? "Carnet de extranjeria" : "DNI"}>
            <Input
              name="customerDocumentNumber"
              value={customerDocumentNumber}
              onChange={(event) => setCustomerDocumentNumber(event.target.value.replace(/\D/g, "").slice(0, documentMaxLength()))}
              inputMode="numeric"
              minLength={customerDocumentType === "DNI" ? 8 : 9}
              maxLength={documentMaxLength()}
              required
            />
          </Field>
          <Field label={customerDocumentType === "RUC" ? "Nombre comercial / razon social" : "Apellidos y nombres completos"} className="lg:col-span-2">
            <Input name="customerFullName" value={customerFullName} onChange={(event) => setCustomerFullName(event.target.value)} required />
          </Field>
          <Field label="Fecha">
            <Input name="saleDate" type="date" defaultValue={today} required />
          </Field>
          <Field label="Canal">
            <Select name="saleChannel"><option value="STORE">Tienda</option><option value="WEB">Web</option><option value="WHATSAPP">WhatsApp</option><option value="DELIVERY">Delivery</option></Select>
          </Field>
          <Field label="Metodo de pago">
            <Select name="paymentMethod"><option value="CASH">Efectivo</option><option value="YAPE">Yape</option><option value="PLIN">Plin</option><option value="TRANSFER">Transferencia</option><option value="CARD">Tarjeta</option><option value="MIXED">Mixto</option></Select>
          </Field>
          <Field label="Notas" className="lg:col-span-3">
            <Input name="notes" placeholder="Comprobante, observacion o referencia" />
          </Field>
        </ModalFormGrid>
      </ModalSection>

      <ModalSection title="Agregar celular por IMEI" description="El flujo principal de celulares es por IMEI. Al buscar se autocompleta producto y unidad fisica.">
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <BarcodeScanner name="imeiLookup" label="IMEI 1 / IMEI 2" value={imei} onValueChange={setImei} />
          <Button type="button" onClick={addPhoneByImei}><Search className="h-4 w-4" /> Agregar celular</Button>
        </div>
      </ModalSection>

      <ModalSection title="Agregar accesorio" description="Los accesorios se venden por SKU y cantidad. Marca regalo si saldra con precio 0.">
        <ModalFormGrid className="lg:grid-cols-4">
          <Field label="Accesorio" className="lg:col-span-2">
            <Select value={accessoryProductId} onChange={(event) => setAccessoryProductId(event.target.value)}>
              <option value="">Seleccionar accesorio</option>
              {accessories.map((product) => <option key={product.id} value={product.id}>{product.skuCode} - {product.brand} {product.name} {product.color ?? ""}</option>)}
            </Select>
          </Field>
          <Field label="Cantidad">
            <Input value={accessoryQty} onChange={(event) => setAccessoryQty(Number(event.target.value))} type="number" min="1" step="1" />
          </Field>
          <Field label="Salida">
            <CheckboxField><input checked={accessoryGift} onChange={(event) => setAccessoryGift(event.target.checked)} type="checkbox" className="h-4 w-4 rounded border-slate-300" /> Regalo</CheckboxField>
          </Field>
        </ModalFormGrid>
        <button type="button" onClick={addAccessory} className="mt-3 inline-flex h-11 items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 text-sm font-bold text-blue-700 hover:bg-blue-100">
          <Plus className="h-4 w-4" />
          Agregar accesorio
        </button>
      </ModalSection>

      <ModalSection title="Items de la venta" description="Revisa precios, descuentos y regalos antes de confirmar.">
        {message ? <div className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-sm font-bold text-amber-700">{message}</div> : null}
        {lines.length ? (
          <div className="space-y-3">
            {lines.map((line) => (
              <div key={line.key} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3 lg:grid-cols-[1fr_120px_140px_120px_44px] lg:items-end">
                <div>
                  <p className="text-xs font-black uppercase text-slate-500">{line.itemType === "PHONE" ? "Celular" : line.isGift ? "Regalo" : "Accesorio"}</p>
                  <p className="text-sm font-bold text-slate-950">{line.label}</p>
                </div>
                <Field label="Cantidad">
                  <Input value={line.quantity} onChange={(event) => updateLine(line.key, { quantity: Number(event.target.value) })} type="number" min="1" disabled={line.itemType === "PHONE"} />
                </Field>
                <Field label="Precio">
                  <Input value={line.unitSalePrice} onChange={(event) => updateLine(line.key, { unitSalePrice: event.target.value })} type="number" min="0" step="0.01" />
                </Field>
                <Field label="Descuento">
                  <Input value={line.discount} onChange={(event) => updateLine(line.key, { discount: event.target.value })} type="number" min="0" step="0.01" />
                </Field>
                <button type="button" onClick={() => setLines((current) => current.filter((item) => item.key !== line.key))} className="grid h-11 w-11 place-items-center rounded-lg border border-red-100 text-red-600 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm font-bold text-slate-500">
            Agrega al menos un celular por IMEI o un accesorio.
          </div>
        )}
      </ModalSection>

      <ModalActions>
        <Button disabled={!lines.length}>Confirmar venta</Button>
      </ModalActions>
    </form>
  );
}
