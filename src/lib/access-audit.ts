export const appTimeZone = process.env.APP_TIME_ZONE ?? "America/Lima";

const countryDisplay =
  typeof Intl.DisplayNames !== "undefined"
    ? new Intl.DisplayNames(["es"], { type: "region" })
    : null;

export function formatAccessDateTime(date?: Date | null) {
  if (!date) return "Sin ingresos";

  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "short",
    timeStyle: "medium",
    hour12: true,
    timeZone: appTimeZone
  }).format(date);
}

export function normalizeCountryCode(value?: string | null) {
  const code = value?.trim().toUpperCase();
  return code && /^[A-Z]{2}$/.test(code) ? code : null;
}

export function countryNameFromCode(countryCode?: string | null) {
  const code = normalizeCountryCode(countryCode);
  if (!code) return null;
  return countryDisplay?.of(code) ?? code;
}

function majorVersion(userAgent: string, pattern: RegExp) {
  return userAgent.match(pattern)?.[1]?.split(".")[0] ?? null;
}

function browserName(userAgent: string) {
  const edge = majorVersion(userAgent, /Edg(?:A|iOS)?\/([\d.]+)/);
  if (edge) return `Microsoft Edge ${edge}`;

  const opera = majorVersion(userAgent, /(?:OPR|Opera)\/([\d.]+)/);
  if (opera) return `Opera ${opera}`;

  const firefox = majorVersion(userAgent, /(?:Firefox|FxiOS)\/([\d.]+)/);
  if (firefox) return `Firefox ${firefox}`;

  const chrome = majorVersion(userAgent, /(?:Chrome|CriOS)\/([\d.]+)/);
  if (chrome) return `Google Chrome ${chrome}`;

  const safari = userAgent.includes("Safari/")
    ? majorVersion(userAgent, /Version\/([\d.]+)/)
    : null;
  if (safari) return `Safari ${safari}`;

  return "Navegador desconocido";
}

function osName(userAgent: string) {
  if (/iPad|iPhone|iPod/.test(userAgent)) return "iOS";
  if (/Android/.test(userAgent)) return "Android";
  if (/Windows NT/.test(userAgent)) return "Windows";
  if (/Mac OS X/.test(userAgent)) return "macOS";
  if (/Linux/.test(userAgent)) return "Linux";
  return null;
}

export function accessClientLabel(userAgent?: string | null) {
  if (!userAgent) return "Cliente desconocido";
  const os = osName(userAgent);
  return os ? `${browserName(userAgent)} en ${os}` : browserName(userAgent);
}

export function accessCountryLabel(country?: string | null, countryCode?: string | null) {
  const code = normalizeCountryCode(countryCode);
  const name = country?.trim() || countryNameFromCode(code);
  if (!name && !code) return "Pais no detectado";
  if (name && code && name.toUpperCase() !== code) return `${name} (${code})`;
  return name ?? code ?? "Pais no detectado";
}
