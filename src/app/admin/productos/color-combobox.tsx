"use client";

import { useMemo, useState } from "react";
import { productColorOptions, colorSwatchStyle, isKnownProductColor } from "@/lib/product-colors";

export function ColorCombobox({ name = "color", defaultValue = "" }: { name?: string; defaultValue?: string | null }) {
  const initialValue = defaultValue ?? "";
  const initialIsKnown = isKnownProductColor(initialValue);
  const [selected, setSelected] = useState(initialIsKnown ? initialValue : "");
  const [query, setQuery] = useState(initialValue);
  const [open, setOpen] = useState(false);

  const options = useMemo(() => {
    return productColorOptions;
  }, []);

  const filtered = options.filter((option) => {
    const term = query.trim().toLowerCase();
    if (!term) return true;
    return option.label.toLowerCase().includes(term) || option.aliases.some((alias) => alias.toLowerCase().includes(term));
  });

  const selectColor = (label: string) => {
    setSelected(label);
    setQuery(label);
    setOpen(false);
  };

  return (
    <div className="relative">
      <input type="hidden" name={name} value={selected} />
      <div className="flex h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 text-sm shadow-sm transition focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-100">
        {selected ? <span className="h-5 w-5 shrink-0 rounded-full border" style={colorSwatchStyle(selected)} /> : null}
        <input
          type="text"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setSelected("");
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          placeholder="Buscar color"
          className="h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-sm outline-none placeholder:text-slate-400"
        />
        {selected ? (
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              setSelected("");
              setQuery("");
              setOpen(true);
            }}
            className="text-xs font-bold text-slate-400 hover:text-slate-700"
            aria-label="Limpiar color"
          >
            X
          </button>
        ) : null}
      </div>
      {open ? (
        <div className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-xl">
          {filtered.length ? (
            filtered.map((option) => (
              <button
                key={option.label}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectColor(option.label)}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-[#098d8f]/5"
              >
                <span className="h-5 w-5 rounded-full border" style={colorSwatchStyle(option.label)} />
                {option.label}
              </button>
            ))
          ) : (
            <p className="px-3 py-2 text-xs font-semibold text-slate-500">No hay colores con ese texto.</p>
          )}
        </div>
      ) : null}
      {!selected && query ? <p className="mt-1 text-xs font-semibold text-amber-600">Selecciona un color de la lista para guardarlo.</p> : null}
    </div>
  );
}
