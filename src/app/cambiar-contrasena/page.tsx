import { changeInitialPasswordAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireUser } from "@/lib/auth";

export default async function ChangePasswordPage({ searchParams }: { searchParams?: Promise<{ error?: string }> }) {
  await requireUser();
  const params = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 px-4">
      <Card className="w-full max-w-md">
        <h1 className="text-xl font-black text-slate-950">Cambiar contrasena</h1>
        <p className="mt-1 text-sm text-slate-500">Por seguridad, debes cambiar la contrasena inicial antes de ingresar al sistema.</p>
        {params?.error ? <p className="mt-4 rounded bg-red-50 p-3 text-sm font-semibold text-red-700">Las contrasenas deben coincidir y tener minimo 8 caracteres.</p> : null}
        <form action={changeInitialPasswordAction} className="mt-5 space-y-4">
          <Input name="password" type="password" placeholder="Nueva contrasena" minLength={8} required />
          <Input name="confirmPassword" type="password" placeholder="Confirmar contrasena" minLength={8} required />
          <Button className="w-full">Guardar contrasena</Button>
        </form>
      </Card>
    </main>
  );
}
