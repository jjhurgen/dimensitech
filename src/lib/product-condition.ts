export const productConditionOptions = [
  { value: "NEW_SEALED", label: "Nuevo sellado" },
  { value: "REFURBISHED", label: "Reacondicionado" },
  { value: "OPEN_BOX", label: "Open box" },
  { value: "USED", label: "Usado" }
] as const;

export type ProductConditionValue = (typeof productConditionOptions)[number]["value"];

export function productConditionLabel(value?: string | null) {
  return productConditionOptions.find((option) => option.value === value)?.label ?? "Nuevo sellado";
}
