"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/input";

export function ProductSortSelect({ basePath = "/tienda" }: { basePath?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  return (
    <Select
      defaultValue={params.get("sort") ?? "recomendados"}
      onChange={(event) => {
        const next = new URLSearchParams(params.toString());
        next.set("sort", event.target.value);
        next.delete("page");
        router.push(`${basePath}?${next.toString()}`);
      }}
      className="h-10 w-44 rounded-md text-sm shadow-none"
    >
      <option value="recomendados">Recomendados</option>
      <option value="menor-precio">Menor precio</option>
      <option value="mayor-precio">Mayor precio</option>
      <option value="recientes">Mas recientes</option>
      <option value="mas-vendidos">Mas vendidos</option>
      <option value="mayor-stock">Mayor stock</option>
      <option value="ultimas">Ultimas unidades</option>
      <option value="ofertas">Ofertas</option>
    </Select>
  );
}
