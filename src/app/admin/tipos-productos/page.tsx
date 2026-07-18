import { ConfirmActionForm } from "@/components/admin/confirm-action-form";
import { AdminModal } from "@/components/admin/admin-modal";
import { CheckboxField, Field, ModalActions, ModalFormGrid, ModalSection } from "@/components/admin/modal-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { prisma } from "@/lib/prisma";
import { deleteProductType, saveProductType } from "./actions";

type ProductTypeRow = {
  id: number;
  name: string;
  requiresImei: boolean;
  defaultMinStock: number;
  status: "ACTIVE" | "INACTIVE";
  _count: {
    skus: number;
    imageLibrary: number;
    providerTypes: number;
  };
};

const errorMessages: Record<string, string> = {
  "nombre-existe": "Ya existe un tipo de producto con ese nombre.",
  "tipo-en-uso": "No se puede eliminar un tipo con productos, proveedores o imagenes vinculadas. Puedes dejarlo inactivo.",
  "no-encontrado": "No se encontro el tipo de producto solicitado."
};

export default async function ProductTypesPage({ searchParams }: { searchParams?: Promise<Record<string, string>> }) {
  const params = await searchParams;
  const productTypes = await prisma.productType.findMany({
    include: {
      _count: { select: { skus: true, imageLibrary: true, providerTypes: true } }
    },
    orderBy: [{ status: "asc" }, { name: "asc" }]
  });
  const error = params?.error ? errorMessages[params.error] : null;

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold">Tipos de productos</h1>
          <p className="text-sm text-slate-500">Administra los tipos disponibles para SKU, compras, proveedores e inventario.</p>
        </div>
        <ProductTypeModal />
      </div>

      {error ? (
        <div className="mx-4 mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
          {error}
        </div>
      ) : null}

      <table className="admin-table">
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Control</th>
            <th>Stock minimo</th>
            <th>Uso</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {productTypes.map((productType) => {
            const linkedCount = productType._count.skus + productType._count.imageLibrary + productType._count.providerTypes;
            const canDelete = linkedCount === 0;

            return (
              <tr key={productType.id}>
                <td className="font-bold text-slate-950">{productType.name}</td>
                <td>{productType.requiresImei ? "Por IMEI" : "Por cantidad"}</td>
                <td>{productType.defaultMinStock}</td>
                <td className="text-sm text-slate-600">
                  {productType._count.skus} SKU(s), {productType._count.providerTypes} proveedor(es), {productType._count.imageLibrary} imagen(es)
                </td>
                <td><Badge value={productType.status} /></td>
                <td>
                  <div className="flex flex-wrap gap-2">
                    <ProductTypeModal productType={productType} />
                    {canDelete ? (
                      <ConfirmActionForm
                        action={deleteProductType}
                        hiddenFields={{ id: productType.id }}
                        triggerLabel="Eliminar"
                        title="Eliminar tipo de producto"
                        message={`Se eliminara el tipo "${productType.name}". Esta accion solo esta disponible porque no tiene datos vinculados.`}
                        confirmLabel="Si, eliminar"
                        variant="danger"
                      />
                    ) : (
                      <span className="inline-flex h-11 items-center rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-400">
                        En uso
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}

function ProductTypeModal({ productType }: { productType?: ProductTypeRow }) {
  const isUsedByProducts = !!productType && productType._count.skus > 0;

  return (
    <AdminModal
      title={productType ? "Editar tipo" : "Nuevo tipo"}
      triggerLabel={productType ? "Editar" : "Nuevo tipo"}
      triggerVariant={productType ? "secondary" : "primary"}
      triggerIcon={productType ? "edit" : "plus"}
      className="max-w-2xl"
    >
      <form action={saveProductType} className="space-y-4">
        {productType ? <input type="hidden" name="id" value={productType.id} /> : null}
        <ModalSection title="Datos del tipo">
          <ModalFormGrid>
            <Field label="Nombre">
              <Input name="name" placeholder="Audifono, Tablet, Smartwatch" required defaultValue={productType?.name ?? ""} />
            </Field>
            <Field label="Stock minimo default">
              <Input name="defaultMinStock" type="number" min="0" max="999" step="1" required defaultValue={productType?.defaultMinStock ?? 3} />
            </Field>
            <Field label="Control de inventario" hint={isUsedByProducts ? "Este valor queda bloqueado porque ya hay SKU creados con este tipo." : undefined}>
              <CheckboxField>
                <input name="requiresImei" type="checkbox" className="h-4 w-4 rounded border-slate-300" defaultChecked={productType?.requiresImei ?? false} disabled={isUsedByProducts} />
                Requiere IMEI por unidad
              </CheckboxField>
            </Field>
            <Field label="Estado">
              <Select name="status" defaultValue={productType?.status ?? "ACTIVE"}>
                <option value="ACTIVE">Activo</option>
                <option value="INACTIVE">Inactivo</option>
              </Select>
            </Field>
          </ModalFormGrid>
        </ModalSection>
        <ModalActions><Button>{productType ? "Guardar cambios" : "Guardar tipo"}</Button></ModalActions>
      </form>
    </AdminModal>
  );
}
