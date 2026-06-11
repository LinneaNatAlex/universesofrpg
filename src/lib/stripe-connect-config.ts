import { SITE_CURRENCY } from "@/lib/currency";

/** Platform commission on marketplace sales (default 10%). */
export function getPlatformCommissionPercent(): number {
  const raw = process.env.PLATFORM_COMMISSION_PERCENT;
  const parsed = raw ? Number.parseFloat(raw) : 10;
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 50) return 10;
  return parsed;
}

export function calculatePlatformFeeCents(priceCents: number): number {
  const fee = Math.round((priceCents * getPlatformCommissionPercent()) / 100);
  return Math.max(0, Math.min(fee, priceCents - 50));
}

export function getConnectDefaultCountry(): string {
  return (process.env.STRIPE_CONNECT_COUNTRY ?? "US").toUpperCase();
}

export function getMarketplaceCurrency(): string {
  return SITE_CURRENCY.toLowerCase();
}

export const MARKETPLACE_PRODUCT_METADATA = "marketplace_purchase" as const;
