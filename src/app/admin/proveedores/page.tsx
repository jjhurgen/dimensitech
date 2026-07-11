import { saveProvider } from "./actions";
import { AdminModal } from "@/components/admin/admin-modal";
import { Field, ModalActions, ModalFormGrid, ModalSection } from "@/components/admin/modal-form";
import { Pager } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/input";
import { prisma } from "@/lib/prisma";
import { pageParams } from "@/lib/utils";

export default async function ProvidersPage({ searchParams }: { searchParams?: Promise<Record<string, string>> }) {
  const params = await searchParams;
  const { page, q, take, skip } = pageParams(params);
  const where = q ? { OR: [{ name: { contains: q } }, { dniRuc: { contains: q } }] } : {};
  const [rows, total, productTypes] = await Promise.all([
    prisma.provider.findMany({
      where,
      include: { productTypes: { include: { productType: true }, orderBy: { productType: { name: "asc" } } } },
      skip,
      take,
      orderBy: { id: "desc" }
    }),
    prisma.provider.count({ where }),
    prisma.productType.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } })
  ]);
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden p-0">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-bold">Proveedores</h2>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <form className="w-full sm:w-64"><Input name="q" placeholder="Buscar" defaultValue={q} /></form>
            <AdminModal title="Nuevo proveedor" triggerLabel="Nuevo proveedor" className="max-w-3xl" description="Registra proveedores para compras, trazabilidad y reportes.">
              <form action={saveProvider} className="space-y-4">
                <ModalSection title="Datos comerciales" description="Identificacion principal del proveedor.">
                  <ModalFormGrid>
                    <Field label="Nombre">
                      <Input name="name" placeholder="Razon social o nombre comercial" required />
                    </Field>
                    <Field label="DNI / RUC">
                      <Input name="dniRuc" placeholder="Documento fiscal" />
                    </Field>
                    <Field label="Estado">
                      <Select name="status"><option value="ACTIVE">Activo</option><option value="INACTIVE">Inactivo</option></Select>
                    </Field>
                  </ModalFormGrid>
                </ModalSection>

                <ModalSection title="Contacto y ubicacion" description="Datos necesarios para coordinar compras y entregas.">
                  <ModalFormGrid>
                    <Field label="Telefono">
                      <Input name="phone" placeholder="Telefono" />
                    </Field>
                    <Field label="WhatsApp">
                      <Input name="whatsapp" placeholder="WhatsApp" />
                    </Field>
                    <Field label="Ciudad">
                      <Input name="city" placeholder="Ciudad" />
                    </Field>
                    <Field label="Direccion">
                      <Input name="address" placeholder="Direccion" />
                    </Field>
                    <Field label="Observacion" className="md:col-span-2">
                      <Textarea name="observation" placeholder="Condiciones, contacto, horario o notas internas" />
                    </Field>
                  </ModalFormGrid>
                </ModalSection>

                <ModalSection title="Tipos de productos" description="Selecciona los rubros que este proveedor puede abastecer.">
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {productTypes.map((type) => (
                      <label key={type.id} className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:border-[#098d8f]/40 hover:bg-[#098d8f]/5">
                        <input name="productTypeIds" value={type.id} type="checkbox" className="h-4 w-4 rounded border-slate-300 text-[#098d8f]" />
                        <span>{type.name}</span>
                      </label>
                    ))}
                  </div>
                </ModalSection>

                <ModalActions>
                  <Button>Guardar proveedor</Button>
                </ModalActions>
              </form>
            </AdminModal>
          </div>
        </div>
        <table className="admin-table">
          <thead><tr><th>Nombre</th><th>DNI/RUC</th><th>Telefono</th><th>Tipos que ofrece</th><th>Estado</th></tr></thead>
          <tbody>{rows.map((row) => (
            <tr key={row.id}>
              <td className="font-bold text-slate-950">{row.name}</td>
              <td>{row.dniRuc}</td>
              <td>{row.phone}</td>
              <td>
                <div className="flex flex-wrap gap-1.5">
                  {row.productTypes.length ? row.productTypes.map(({ productType }) => (
                    <span key={productType.id} className="rounded-full border border-[#098d8f]/20 bg-[#098d8f]/10 px-2 py-0.5 text-xs font-bold text-[#003f48]">
                      {productType.name}
                    </span>
                  )) : <span className="text-sm font-medium text-slate-400">Sin tipos asignados</span>}
                </div>
              </td>
              <td><Badge value={row.status} /></td>
            </tr>
          ))}</tbody>
        </table>
        <Pager page={page} total={total} basePath="/admin/proveedores" />
      </Card>
    </div>
  );
}
