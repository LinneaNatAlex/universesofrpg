import type { PricingType } from "@/types/database";

interface PricingFieldsProps {
  pricing: PricingType;
  priceCents: number;
  onPricingChange: (pricing: PricingType) => void;
  onPriceCentsChange: (cents: number) => void;
}

export function PricingFields({
  pricing,
  priceCents,
  onPricingChange,
  onPriceCentsChange,
}: PricingFieldsProps) {
  return (
    <div className="comic-panel p-4 space-y-3">
      <p className="font-comic text-sm text-ink">Listing type</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onPricingChange("free")}
          className={`px-4 py-2 font-comic text-sm border-2 border-ink ${
            pricing === "free"
              ? "bg-emerald-200 text-ink shadow-[2px_2px_0_#1a1a2e]"
              : "bg-surface text-ink hover:bg-comic-yellow"
          }`}
        >
          Free (Explore) — auto-approved
        </button>
        <button
          type="button"
          onClick={() => onPricingChange("one_time")}
          className={`px-4 py-2 font-comic text-sm border-2 border-ink ${
            pricing !== "free"
              ? "bg-comic-red text-white shadow-[2px_2px_0_#1a1a2e]"
              : "bg-surface text-ink hover:bg-comic-yellow"
          }`}
        >
          Paid (Shop) — editor review
        </button>
      </div>
      {pricing !== "free" && (
        <div>
          <label className="block text-sm font-comic text-ink mb-1">Price (USD)</label>
          <div className="flex items-center gap-1 w-fit">
            <span className="font-comic text-sm text-ink border-2 border-ink bg-comic-yellow px-2 py-2">
              $
            </span>
            <input
              type="number"
              min={1}
              step={0.01}
              value={(priceCents / 100).toFixed(2)}
              onChange={(e) =>
                onPriceCentsChange(
                  Math.max(100, Math.round(parseFloat(e.target.value || "0") * 100))
                )
              }
              className="w-28 border-2 border-ink bg-surface px-3 py-2 text-sm"
            />
          </div>
          <p className="text-xs text-ink-muted mt-2">
            Paid Shop listings are held as <strong>pending</strong> until a certified editor
            approves them. Free content publishes immediately.
          </p>
        </div>
      )}
    </div>
  );
}
