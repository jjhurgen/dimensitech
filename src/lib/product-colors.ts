export const productColorOptions = [
  { label: "Negro", hex: "#111827", aliases: ["black"] },
  { label: "Blanco", hex: "#f8fafc", aliases: ["white"] },
  { label: "Azul", hex: "#2563eb", aliases: ["blue"] },
  { label: "Azul claro", hex: "#38bdf8", aliases: ["celeste", "light blue"] },
  { label: "Azul oscuro", hex: "#1e3a8a", aliases: ["dark blue"] },
  { label: "Rojo", hex: "#dc2626", aliases: ["red"] },
  { label: "Verde", hex: "#16a34a", aliases: ["green"] },
  { label: "Morado", hex: "#7c3aed", aliases: ["purpura", "purple"] },
  { label: "Lila", hex: "#a78bfa", aliases: ["lavanda"] },
  { label: "Rosado", hex: "#f9a8d4", aliases: ["rosa", "pink"] },
  { label: "Amarillo", hex: "#facc15", aliases: ["yellow"] },
  { label: "Naranja", hex: "#fb923c", aliases: ["orange"] },
  { label: "Dorado", hex: "#d4af37", aliases: ["oro", "gold"] },
  { label: "Plateado", hex: "#d1d5db", aliases: ["plata", "silver"] },
  { label: "Gris", hex: "#9ca3af", aliases: ["gray"] },
  { label: "Grafito", hex: "#374151", aliases: ["graphite"] },
  { label: "Titanio natural", hex: "#c8b6a6", aliases: ["natural titanium", "natural"] },
  { label: "Titanio azul", hex: "#64748b", aliases: ["blue titanium"] },
  { label: "Titanio blanco", hex: "#e5e7eb", aliases: ["white titanium"] },
  { label: "Titanio negro", hex: "#27272a", aliases: ["black titanium"] },
  { label: "Coral", hex: "#fb7185", aliases: [] },
  { label: "Transparente", hex: "#f8fafc", aliases: ["clear", "transparent"] }
] as const;

export function isKnownProductColor(color?: string | null) {
  if (!color) return true;
  return productColorOptions.some((option) => option.label.toLowerCase() === color.toLowerCase());
}

export function colorSwatchStyle(color?: string | null) {
  const normalized = (color ?? "").toLowerCase();
  const match = productColorOptions.find((option) =>
    normalized.includes(option.label.toLowerCase()) ||
    option.aliases.some((alias) => normalized.includes(alias.toLowerCase()))
  );
  const background = match?.hex ?? "#e2e8f0";
  const isLight = ["#f8fafc", "#d1d5db", "#e2e8f0", "#d4af37", "#c8b6a6"].includes(background);

  return {
    background,
    borderColor: isLight ? "#cbd5e1" : background
  };
}
