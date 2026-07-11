import { saveBrand } from "./actions";
import { AdminModal } from "@/components/admin/admin-modal";
import { Field, ModalActions, ModalFormGrid, ModalSection } from "@/components/admin/modal-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { allBrands } from "@/lib/brands";

export default async function BrandsPage() {
  const brands = await allBrands();
  return (
    <Card className="overflow-hidden p-0">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold">Marcas</h1>
          <p className="text-sm text-slate-500">Administra las marcas disponibles para Producto/SKU.</p>
        </div>
        <BrandModal />
      </div>
      <table className="admin-table">
        <thead><tr><th>Marca</th><th>Estado</th><th>Acciones</th></tr></thead>
        <tbody>
          {brands.map((brand) => (
            <tr key={brand.id}>
              <td className="font-bold text-slate-950">{brand.name}</td>
              <td><Badge value={brand.status} /></td>
              <td><BrandModal brand={brand} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function BrandModal({ brand }: { brand?: { id: number; name: string; status?: "ACTIVE" | "INACTIVE" } }) {
  return (
    <AdminModal title={brand ? "Editar marca" : "Nueva marca"} triggerLabel={brand ? "Editar" : "Nueva marca"} triggerVariant={brand ? "secondary" : "primary"} triggerIcon={brand ? "edit" : "plus"} className="max-w-xl">
      <form action={saveBrand} className="space-y-4">
        {brand ? <input type="hidden" name="id" value={brand.id} /> : null}
        <ModalSection title="Datos de marca">
          <ModalFormGrid>
            <Field label="Nombre">
              <Input name="name" placeholder="Apple, Samsung, Xiaomi" required defaultValue={brand?.name ?? ""} />
            </Field>
            <Field label="Estado">
              <Select name="status" defaultValue={brand?.status ?? "ACTIVE"}><option value="ACTIVE">Activo</option><option value="INACTIVE">Inactivo</option></Select>
            </Field>
          </ModalFormGrid>
        </ModalSection>
        <ModalActions><Button>Guardar marca</Button></ModalActions>
      </form>
    </AdminModal>
  );
}
