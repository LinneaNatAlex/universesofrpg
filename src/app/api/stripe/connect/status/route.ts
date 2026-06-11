import { NextResponse } from "next/server";
import { resolveSellerUsername } from "@/lib/api-session-auth";
import { getPlatformCommissionPercent } from "@/lib/stripe-connect-config";
import { getStripe, isStripeConnectConfigured } from "@/lib/stripe-server";
import {
  getConnectAccount,
  upsertConnectAccount,
} from "@/lib/marketplace-platform-store";

export async function GET(request: Request) {
  if (!isStripeConnectConfigured()) {
    return NextResponse.json({
      configured: false,
      charges_enabled: false,
      payouts_enabled: false,
      details_submitted: false,
      platform_commission_percent: getPlatformCommissionPercent(),
    });
  }

  const actingUsername = new URL(request.url).searchParams.get("acting_username");
  const auth = await resolveSellerUsername(actingUsername);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const username = auth.sellerUsername;
  const record = await getConnectAccount(username);

  if (!record?.stripe_account_id) {
    return NextResponse.json({
      configured: true,
      connected: false,
      charges_enabled: false,
      payouts_enabled: false,
      details_submitted: false,
      seller_username: username,
      platform_commission_percent: getPlatformCommissionPercent(),
    });
  }

  const stripe = getStripe()!;
  const account = await stripe.accounts.retrieve(record.stripe_account_id);

  const updated = {
    username,
    stripe_account_id: account.id,
    charges_enabled: account.charges_enabled ?? false,
    payouts_enabled: account.payouts_enabled ?? false,
    details_submitted: account.details_submitted ?? false,
    updated_at: new Date().toISOString(),
  };
  await upsertConnectAccount(updated);

  return NextResponse.json({
    configured: true,
    connected: true,
    seller_username: username,
    stripe_account_id: account.id,
    charges_enabled: updated.charges_enabled,
    payouts_enabled: updated.payouts_enabled,
    details_submitted: updated.details_submitted,
    platform_commission_percent: getPlatformCommissionPercent(),
  });
}
