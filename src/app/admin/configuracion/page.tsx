import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { prisma } from "@/lib/prisma";
import { updateReservationExpirationAction } from "./actions";

export default async function SettingsPage() {
  const settings = await prisma.setting.findMany({ orderBy: { key: "asc" } });
  const reservationMinutes =
    settings.find((setting) => setting.key === "reservation_expiration_minutes")?.value ??
    String(Number(settings.find((setting) => setting.key === "reservation_expiration_hours")?.value ?? 24) * 60);
  return (
    <div className="space-y-6">
      <Card>
        <h1 className="mb-4 text-xl font-bold">Configuracion</h1>
        <form action={updateReservationExpirationAction} className="max-w-md space-y-3">
          <div>
            <label className="text-sm font-bold text-slate-700">Tiempo para confirmar pago de reservas web</label>
            <p className="mb-2 text-xs text-slate-500">Durante este tiempo el stock queda apartado. Si vence o se cancela, el stock se libera.</p>
            <Select name="reservationExpirationMinutes" defaultValue={reservationMinutes}>
              <option value="15">15 minutos</option>
              <option value="60">1 hora</option>
              <option value="720">12 horas</option>
              <option value="1440">24 horas</option>
            </Select>
          </div>
          <Button>Guardar configuracion</Button>
        </form>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-bold">Valores internos</h2>
        {settings.map((setting) => <p key={setting.id} className="border-t py-2 text-sm"><span className="font-semibold">{setting.key}</span>: {setting.value}</p>)}
      </Card>
    </div>
  );
}
