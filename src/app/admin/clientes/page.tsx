import { saveCustomer } from "./actions";
import { AdminModal } from "@/components/admin/admin-modal";
import { Field, ModalActions, ModalFormGrid, ModalSection } from "@/components/admin/modal-form";
import { Pager } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { prisma } from "@/lib/prisma";
import { pageParams } from "@/lib/utils";

export default async function CustomersPage({ searchParams }: { searchParams?: Promise<Record<string, string>> }) {
  const params = await searchParams;
  const { page, q, take, skip } = pageParams(params);
  const where = q ? { OR: [{ dni: { contains: q } }, { firstNames: { contains: q } }, { lastNames: { contains: q } }] } : {};
  const [rows, total] = await Promise.all([
    prisma.customer.findMany({ where, skip, take, orderBy: { id: "desc" } }),
    prisma.customer.count({ where })
  ]);
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden p-0">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-bold">Clientes</h2>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <form className="w-full sm:w-64"><Input name="q" placeholder="DNI o nombre" defaultValue={q} /></form>
            <AdminModal title="Nuevo cliente" triggerLabel="Nuevo cliente" className="max-w-3xl" description="Crea una ficha de cliente para ventas, reservas y seguimiento.">
              <form action={saveCustomer} className="space-y-4">
                <ModalSection title="Identidad" description="Datos basicos para ubicar al cliente en ventas y reservas.">
                  <ModalFormGrid>
                    <Field label="DNI">
                      <Input name="dni" placeholder="Documento de identidad" />
                    </Field>
                    <Field label="Telefono">
                      <Input name="phone" placeholder="WhatsApp o celular" />
                    </Field>
                    <Field label="Nombres">
                      <Input name="firstNames" placeholder="Nombres" required />
                    </Field>
                    <Field label="Apellidos">
                      <Input name="lastNames" placeholder="Apellidos" required />
                    </Field>
                  </ModalFormGrid>
                </ModalSection>

                <ModalSection title="Direccion y observaciones" description="Informacion util para entregas o historial comercial.">
                  <ModalFormGrid>
                    <Field label="Ciudad">
                      <Input name="city" placeholder="Ciudad" />
                    </Field>
                    <Field label="Direccion">
                      <Input name="address" placeholder="Direccion o referencia" />
                    </Field>
                    <Field label="Observacion" className="md:col-span-2">
                      <Textarea name="observation" placeholder="Preferencias, referencias o comentarios internos" />
                    </Field>
                  </ModalFormGrid>
                </ModalSection>

                <ModalActions>
                  <Button>Guardar cliente</Button>
                </ModalActions>
              </form>
            </AdminModal>
          </div>
        </div>
        <table className="admin-table">
          <thead><tr><th>DNI</th><th>Nombres</th><th>Telefono</th><th>Ciudad</th></tr></thead>
          <tbody>{rows.map((row) => <tr key={row.id}><td>{row.dni}</td><td className="font-medium">{row.firstNames} {row.lastNames}</td><td>{row.phone}</td><td>{row.city}</td></tr>)}</tbody>
        </table>
        <Pager page={page} total={total} basePath="/admin/clientes" />
      </Card>
    </div>
  );
}
