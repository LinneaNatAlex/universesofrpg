import { NextResponse } from "next/server";
import { resolveSellerUsername } from "@/lib/api-session-auth";
import { getConnectDefaultCountry } from "@/lib/stripe-connect-config";
import { getStripe, isStripeConnectConfigured } from "@/lib/stripe-server";
import {
  getConnectAccount,
  upsertConnectAccount,
} from "@/lib/marketplace-platform-store";

export async function POST(request: Request) {
  if (!isStripeConnectConfigured()) {
    return NextResponse.json(
      { error: "Stripe Connect is not configured. Add STRIPE_SECRET_KEY to .env.local." },
      { status: 503 }
    );
  }

  let body: { country?: string; acting_username?: string } = {};
  try {
    body = await request.json();
  } catch {
    // empty body is fine
  }

  const auth = await resolveSellerUsername(body.acting_username);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const stripe = getStripe()!;
  const origin = new URL(request.url).origin;
  const isLiveKey = process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_");
  if (isLiveKey && origin.startsWith("http://")) {
    return NextResponse.json(
      {
        error:
          "Live Stripe requires HTTPS. On localhost, use sk_test_ / pk_test_ keys, or test Shop payouts on your deployed site (Netlify).",
      },
      { status: 400 }
    );
  }

  const username = auth.sellerUsername;

  const country = (body.country ?? getConnectDefaultCountry()).toUpperCase();

  try {
    let record = await getConnectAccount(username);
    let accountId = record?.stripe_account_id;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country,
        email: auth.user.email ?? undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: {
          uorpg_username: username,
        },
      });
      accountId = account.id;
      record = {
        username,
        stripe_account_id: accountId,
        charges_enabled: account.charges_enabled ?? false,
        payouts_enabled: account.payouts_enabled ?? false,
        details_submitted: account.details_submitted ?? false,
        updated_at: new Date().toISOString(),
      };
      await upsertConnectAccount(record);
    }

    const account = await stripe.accounts.retrieve(accountId);
    const ready = account.charges_enabled && account.details_submitted;

    if (ready) {
      const login = await stripe.accounts.createLoginLink(accountId);
      return NextResponse.json({
        url: login.url,
        stripe_account_id: accountId,
        mode: "express_dashboard",
      });
    }

    const linkType = account.details_submitted ? "account_update" : "account_onboarding";
    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/settings?tab=applications&connect=refresh`,
      return_url: `${origin}/settings?tab=applications&connect=success`,
      type: linkType,
    });

    return NextResponse.json({
      url: link.url,
      stripe_account_id: accountId,
      mode: linkType,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not start Stripe onboarding.";
    console.error("[connect/onboard]", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
