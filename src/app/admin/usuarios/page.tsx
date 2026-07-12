import { ConfirmActionForm } from "@/components/admin/confirm-action-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { accessClientLabel, accessCountryLabel, formatAccessDateTime } from "@/lib/access-audit";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createUserAction, resetUserPasswordAction, toggleUserAction, updateUserAction } from "./actions";
import { redirect } from "next/navigation";

function dateValue(date?: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "";
}

function dateTimeValue(date?: Date | null) {
  return formatAccessDateTime(date);
}

function shortUserAgent(userAgent?: string | null) {
  return accessClientLabel(userAgent);
}

export default async function UsersPage() {
  const current = await requireUser();
  if (current.role !== "ADMIN") redirect("/admin");
  const users = await prisma.user.findMany({
    include: { loginEvents: { orderBy: { createdAt: "desc" }, take: 5 } },
    orderBy: [{ isActive: "desc" }, { name: "asc" }]
  });

  return (
    <div className="space-y-6">
      <Card>
        <h1 className="text-xl font-black text-slate-950">Usuarios</h1>
        <p className="mt-1 text-sm text-slate-500">Crea usuarios del sistema. La contrasena inicial sera el DNI y deberan cambiarla en su primer ingreso.</p>

        <form action={createUserAction} className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <Input name="dni" placeholder="DNI" minLength={8} maxLength={12} required />
          <Input name="firstNames" placeholder="Nombres" required />
          <Input name="lastNames" placeholder="Apellidos" required />
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-500">Fecha de nacimiento</label>
            <Input name="birthDate" type="date" />
          </div>
          <Input name="phone" placeholder="Celular" />
          <Select name="role" defaultValue="SELLER">
            <option value="ADMIN">Administrador</option>
            <option value="SELLER">Vendedor</option>
            <option value="WAREHOUSE">Almacen</option>
          </Select>
          <Input name="address" placeholder="Direccion" className="xl:col-span-2" />
          <Button>Crear usuario</Button>
        </form>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-slate-100 p-4">
          <h2 className="text-lg font-black">Usuarios registrados</h2>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Contacto</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Ultimo acceso</th>
              <th>Seguridad</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <p className="font-bold text-slate-950">{user.name}</p>
                  <p className="text-xs text-slate-500">DNI: {user.dni ?? "Sin DNI"}</p>
                </td>
                <td>
                  <p>{user.phone ?? "-"}</p>
                  <p className="text-xs text-slate-500">{user.address ?? ""}</p>
                </td>
                <td><Badge value={user.role} /></td>
                <td><Badge value={user.isActive ? "ACTIVE" : "INACTIVE"} /></td>
                <td className="min-w-72">
                  <p className="font-bold text-slate-950">{dateTimeValue(user.lastLoginAt)}</p>
                  <p className="text-xs text-slate-500">IP: {user.lastLoginIp ?? "-"}</p>
                  <p className="text-xs text-slate-500">Pais: {accessCountryLabel(user.lastLoginCountry, user.lastLoginCountryCode)}</p>
                  <p className="max-w-sm truncate text-xs text-slate-500" title={user.lastLoginUserAgent ?? undefined}>
                    {shortUserAgent(user.lastLoginUserAgent)}
                  </p>
                  {user.loginEvents.length ? (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs font-black text-[#098d8f]">Ver historial</summary>
                      <div className="mt-2 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                        {user.loginEvents.map((event) => (
                          <div key={event.id} className="border-b border-slate-200 pb-2 last:border-b-0 last:pb-0">
                            <p className="text-xs font-bold text-slate-800">{dateTimeValue(event.createdAt)}</p>
                            <p className="text-xs text-slate-500">IP: {event.ipAddress ?? "-"}</p>
                            <p className="text-xs text-slate-500">Pais: {accessCountryLabel(event.country, event.countryCode)}</p>
                            <p className="text-xs text-slate-500" title={event.userAgent ?? undefined}>{shortUserAgent(event.userAgent)}</p>
                          </div>
                        ))}
                      </div>
                    </details>
                  ) : null}
                </td>
                <td>{user.mustChangePassword ? <span className="text-xs font-black text-amber-700">Debe cambiar contrasena</span> : <span className="text-xs font-semibold text-slate-500">Actualizada</span>}</td>
                <td>
                  <div className="flex flex-wrap gap-2">
                    <details className="w-full min-w-72">
                      <summary className="cursor-pointer rounded-md border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">Editar</summary>
                      <form action={updateUserAction} className="mt-3 grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <input type="hidden" name="userId" value={user.id} />
                        <Input name="dni" defaultValue={user.dni ?? ""} minLength={8} maxLength={12} required />
                        <Input name="firstNames" defaultValue={user.firstNames ?? user.name} required />
                        <Input name="lastNames" defaultValue={user.lastNames ?? ""} required />
                        <Input name="birthDate" type="date" defaultValue={dateValue(user.birthDate)} />
                        <Input name="phone" defaultValue={user.phone ?? ""} placeholder="Celular" />
                        <Input name="address" defaultValue={user.address ?? ""} placeholder="Direccion" />
                        <Select name="role" defaultValue={user.role}>
                          <option value="ADMIN">Administrador</option>
                          <option value="SELLER">Vendedor</option>
                          <option value="WAREHOUSE">Almacen</option>
                        </Select>
                        <Button>Guardar cambios</Button>
                      </form>
                    </details>
                    <ConfirmActionForm
                      action={resetUserPasswordAction}
                      hiddenFields={{ userId: user.id }}
                      triggerLabel="Resetear clave"
                      title="Restablecer contrasena"
                      message={`La contrasena de ${user.name} volvera a ser su DNI y se le pedira cambiarla al ingresar.`}
                      confirmLabel="Si, restablecer"
                    />
                    <form action={toggleUserAction}>
                      <input type="hidden" name="userId" value={user.id} />
                      <input type="hidden" name="isActive" value={String(!user.isActive)} />
                      <Button className={user.isActive ? "bg-slate-700 hover:bg-slate-800" : ""}>{user.isActive ? "Desactivar" : "Activar"}</Button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
