import { loginAction } from "./actions";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default async function LoginPage({ searchParams }: { searchParams?: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f7f9] px-4 py-8">
      <section className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70">
        <div className="border-b border-slate-100 px-6 pb-5 pt-7 text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center overflow-hidden rounded-full bg-white p-1 shadow-lg shadow-slate-300/70 ring-1 ring-slate-200">
            <Image src="/uploads/logo/logo.jpg" alt="DimensiTech" width={80} height={80} className="h-full w-full object-contain" priority />
          </div>
          <h1 className="mt-4 text-xl font-black tracking-wide text-slate-950">DimensiTech</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Panel administrativo</p>
        </div>

        <form action={loginAction} className="space-y-4 px-6 py-6">
          {params?.error ? <p className="rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">Credenciales incorrectas</p> : null}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-500">Usuario</label>
            <Input name="email" placeholder="DNI o correo" required autoComplete="username" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-500">Contrasena</label>
            <Input name="password" type="password" placeholder="Ingresa tu contrasena" required autoComplete="current-password" />
          </div>
          <Button className="h-11 w-full rounded-md bg-[#098d8f] hover:bg-[#003f48]">Ingresar</Button>
        </form>
      </section>
    </main>
  );
}
