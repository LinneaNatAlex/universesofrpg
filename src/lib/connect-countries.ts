/** Stripe Express — common supported countries (ISO 3166-1 alpha-2). */
export const CONNECT_EXPRESS_COUNTRIES = [
  { code: "NO", label: "Norway" },
  { code: "SE", label: "Sweden" },
  { code: "DK", label: "Denmark" },
  { code: "FI", label: "Finland" },
  { code: "US", label: "United States" },
  { code: "CA", label: "Canada" },
  { code: "GB", label: "United Kingdom" },
  { code: "IE", label: "Ireland" },
  { code: "DE", label: "Germany" },
  { code: "FR", label: "France" },
  { code: "NL", label: "Netherlands" },
  { code: "BE", label: "Belgium" },
  { code: "AT", label: "Austria" },
  { code: "CH", label: "Switzerland" },
  { code: "ES", label: "Spain" },
  { code: "IT", label: "Italy" },
  { code: "PT", label: "Portugal" },
  { code: "PL", label: "Poland" },
  { code: "AU", label: "Australia" },
  { code: "NZ", label: "New Zealand" },
] as const;

export function isConnectCountryCode(code: string): boolean {
  return CONNECT_EXPRESS_COUNTRIES.some((c) => c.code === code.toUpperCase());
}

export function defaultConnectCountryCode(): string {
  if (typeof window !== "undefined") {
    const locale = navigator.language;
    const fromLocale = locale.split("-")[1]?.toUpperCase();
    if (fromLocale && isConnectCountryCode(fromLocale)) return fromLocale;
  }
  return "NO";
}
