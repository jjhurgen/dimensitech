import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { productConditionOptions } from "@/lib/product-condition";
import { StoreFilters } from "@/lib/storefront";

const brands = ["Apple", "Samsung", "Xiaomi", "Redmi", "Honor", "Infinix", "Motorola", "Otros"];
const colors = ["Negro", "Blanco", "Azul", "Rosado", "Rojo", "Verde", "Titanio natural", "Titanio azul", "Gris", "Dorado", "Otro"];
const models = ["iPhone 13", "iPhone 14", "iPhone 15", "iPhone 16", "iPhone 17", "Galaxy A56", "Redmi Note 15"];
const compatibility = ["iPhone 13", "iPhone 14", "iPhone 15", "iPhone 15 Pro Max", "Samsung A56", "Redmi Note 15"];

export function StoreFiltersPanel({ filters, compact = false }: { filters: StoreFilters; compact?: boolean }) {
  return (
    <form action="/tienda" className="space-y-4">
      <input type="hidden" name="search" value={filters.search ?? ""} />
      <FilterBlock title="Categoria">
        <Select name="categoria" defaultValue={filters.categoria ?? ""}>
          <option value="">Todas</option>
          <option value="celulares">Celulares</option>
          <option value="accesorios">Accesorios</option>
        </Select>
        <Select name="tipo" defaultValue={filters.tipo ?? ""}>
          <option value="">Tipo de producto</option>
          <option value="cubo">Cubos</option>
          <option value="cable">Cables</option>
          <option value="case">Cases</option>
          <option value="mica">Micas</option>
          <option value="audifono">Audifonos</option>
          <option value="cargador">Cargadores</option>
        </Select>
      </FilterBlock>

      <FilterBlock title="Marca">
        <Select name="marca" defaultValue={filters.marca ?? ""}>
          <option value="">Todas las marcas</option>
          {brands.map((brand) => <option key={brand} value={brand.toLowerCase()}>{brand}</option>)}
        </Select>
      </FilterBlock>

      <FilterBlock title="Celulares">
        <Select name="plataforma" defaultValue={filters.plataforma ?? ""}>
          <option value="">iPhone / Android</option>
          <option value="IPHONE">iPhone</option>
          <option value="ANDROID">Android</option>
        </Select>
        <Select name="modelo" defaultValue={filters.modelo ?? ""}>
          <option value="">Modelo</option>
          {models.map((model) => <option key={model} value={model}>{model}</option>)}
        </Select>
        <Select name="almacenamiento" defaultValue={filters.almacenamiento ?? ""}>
          <option value="">Almacenamiento</option>
          {["64GB", "128GB", "256GB", "512GB", "1TB"].map((value) => <option key={value}>{value}</option>)}
        </Select>
        <Select name="ram" defaultValue={filters.ram ?? ""}>
          <option value="">RAM</option>
          {["4GB", "6GB", "8GB", "12GB"].map((value) => <option key={value}>{value}</option>)}
        </Select>
      </FilterBlock>

      <FilterBlock title="Color y condicion">
        <Select name="color" defaultValue={filters.color ?? ""}>
          <option value="">Color</option>
          {colors.map((color) => <option key={color} value={color}>{color}</option>)}
        </Select>
        <Select name="condicion" defaultValue={filters.condicion ?? ""}>
          <option value="">Condicion</option>
          {productConditionOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </Select>
      </FilterBlock>

      <FilterBlock title="Precio">
        <div className="grid grid-cols-2 gap-2">
          <Input name="min" type="number" placeholder="Min" defaultValue={filters.min ?? ""} />
          <Input name="max" type="number" placeholder="Max" defaultValue={filters.max ?? ""} />
        </div>
      </FilterBlock>

      <FilterBlock title="Disponibilidad">
        <Select name="disponibilidad" defaultValue={filters.disponibilidad ?? ""}>
          <option value="">Todos</option>
          <option value="disponible">Disponible</option>
          <option value="ultimas">Ultimas unidades</option>
          <option value="a-pedido">A pedido</option>
          <option value="sin-stock">Sin stock</option>
        </Select>
      </FilterBlock>

      <FilterBlock title="Compatibilidad">
        <Select name="compatibilidad" defaultValue={filters.compatibilidad ?? ""}>
          <option value="">Accesorios para</option>
          {compatibility.map((item) => <option key={item}>{item}</option>)}
        </Select>
      </FilterBlock>

      <FilterBlock title="Envio">
        <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" /> Disponible para Lima</label>
        <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" /> Disponible para provincia</label>
        <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" /> Recojo en tienda</label>
      </FilterBlock>

      <Button className="w-full rounded-md bg-[#098d8f] hover:bg-[#003f48]">
        <SlidersHorizontal className="h-4 w-4" />
        {compact ? "Aplicar filtros" : "Filtrar productos"}
      </Button>
    </form>
  );
}

function FilterBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2.5 border-b border-slate-100 pb-4 last:border-b-0">
      <h3 className="text-xs font-black uppercase text-slate-700">{title}</h3>
      <div className="space-y-2 [&_input]:rounded-md [&_input]:shadow-none [&_select]:rounded-md [&_select]:shadow-none">{children}</div>
    </section>
  );
}
