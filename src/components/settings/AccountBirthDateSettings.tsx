"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useAccountAge } from "@/hooks/useAccountAge";
import {
  ADULT_PURCHASE_AGE,
  ageFromBirthDate,
  isMinorForPurchases,
  isValidSignupBirthDate,
  maxSignupBirthDate,
  minSignupBirthDate,
  parseBirthDate,
} from "@/lib/account-age";
import { createClient } from "@/lib/supabase/client";

export function AccountBirthDateSettings() {
  const router = useRouter();
  const { user } = useAuth();
  const { age, isMinor, missingAge } = useAccountAge();
  const [birthDate, setBirthDate] = useState("");
  const [minorPurchaseAck, setMinorPurchaseAck] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const meta = user?.user_metadata as Record<string, unknown> | undefined;
    const existing = parseBirthDate(meta);
    setBirthDate(existing ?? "");
    setMinorPurchaseAck(meta?.minor_purchase_rules_acknowledged === true);
    setSaved(false);
  }, [user]);

  const draftAge = birthDate ? ageFromBirthDate(birthDate) : null;
  const showMinorAck = isMinorForPurchases(draftAge);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    const date = birthDate.trim();
    if (!isValidSignupBirthDate(date)) {
      setError("Enter a valid birth date. You must be at least 13 years old.");
      return;
    }

    if (showMinorAck && !minorPurchaseAck) {
      setError(
        `If you are under ${ADULT_PURCHASE_AGE}, confirm guardian approval for Shop purchases.`
      );
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const { error: metaError } = await supabase.auth.updateUser({
        data: {
          birth_date: date,
          minor_purchase_rules_acknowledged: showMinorAck ? minorPurchaseAck : false,
        },
      });
      if (metaError) {
        setError(metaError.message);
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("Could not save birth date. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="border-t-4 border-dashed border-ink pt-6 space-y-3">
      <h3 className="font-comic text-lg text-ink">Birth date</h3>
      <p className="text-xs text-ink-muted leading-relaxed">
        Required for Shop purchases. Used only for age rules — never shown on your public profile.
      </p>
      {missingAge && (
        <p className="text-xs font-comic text-comic-red comic-panel px-3 py-2">
          Your account is missing a birth date. Add it here before buying paid listings.
        </p>
      )}
      {!missingAge && age != null && (
        <p className="text-xs text-ink-muted">
          Account age on file: {age} years
          {isMinor ? ` (under ${ADULT_PURCHASE_AGE} — guardian checkbox required at checkout)` : ""}.
        </p>
      )}
      <div>
        <label htmlFor="settings-birth-date" className="block font-comic text-xs uppercase text-ink-muted mb-1">
          Birth date (fødselsdato)
        </label>
        <input
          id="settings-birth-date"
          type="date"
          min={minSignupBirthDate()}
          max={maxSignupBirthDate()}
          value={birthDate}
          onChange={(e) => {
            setBirthDate(e.target.value);
            setSaved(false);
          }}
          className="w-full border-2 border-ink bg-surface px-3 py-2 text-sm"
        />
      </div>
      {showMinorAck && (
        <label className="flex items-start gap-2 text-sm text-ink leading-snug cursor-pointer">
          <input
            type="checkbox"
            checked={minorPurchaseAck}
            onChange={(e) => setMinorPurchaseAck(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-comic-red"
          />
          <span>
            I am under {ADULT_PURCHASE_AGE}. A parent or legal guardian has reviewed the{" "}
            <Link href="/rights" className="text-comic-red hover:underline">
              Rights &amp; Terms
            </Link>{" "}
            with me and will approve paid Shop purchases on this account.
          </span>
        </label>
      )}
      {error && <p className="text-xs text-comic-red font-comic">{error}</p>}
      {saved && (
        <p className="text-xs text-ink font-comic">Birth date saved. You can return to the Shop.</p>
      )}
      <Button type="submit" variant="comic" size="sm" disabled={saving || !birthDate}>
        {saving ? "Saving…" : "Save birth date"}
      </Button>
    </form>
  );
}
