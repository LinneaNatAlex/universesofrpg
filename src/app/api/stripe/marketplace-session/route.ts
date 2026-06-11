import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { MARKETPLACE_PRODUCT_METADATA } from "@/lib/stripe-connect-config";
import { getStripe, isStripeConnectConfigured } from "@/lib/stripe-server";
import {
  getConnectAccount,
  hasPlatformPurchase,
  recordPlatformPurchase,
} from "@/lib/marketplace-platform-store";

async function recordFromSession(
  session: Stripe.Checkout.Session,
  sellerStripeAccountId: string
) {
  const product = session.metadata?.uorpg_product;
  if (product !== MARKETPLACE_PRODUCT_METADATA) {
    return { ok: false as const, error: "Not a marketplace checkout" };
  }

  const postId = session.metadata?.uorpg_post_id;
  const buyerUsername = session.metadata?.uorpg_buyer_username;
  const sellerUsername = session.metadata?.uorpg_seller_username;
  const platformFeeRaw = session.metadata?.uorpg_platform_fee_cents;

  if (!postId || !buyerUsername || !sellerUsername) {
    return { ok: false as const, error: "Checkout metadata incomplete" };
  }

  const amountCents = session.amount_total ?? 0;
  const platformFeeCents = platformFeeRaw
    ? Number.parseInt(platformFeeRaw, 10)
    : 0;

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  await recordPlatformPurchase({
    buyer_username: buyerUsername,
    post_id: postId,
    seller_username: sellerUsername,
    amount_cents: amountCents,
    platform_fee_cents: Number.isFinite(platformFeeCents) ? platformFeeCents : 0,
    stripe_checkout_session_id: session.id,
    stripe_payment_intent_id: paymentIntentId,
    purchased_at: new Date().toISOString(),
  });

  return {
    ok: true as const,
    post_id: postId,
    buyer_username: buyerUsername,
    seller_username: sellerUsername,
    amount_cents: amountCents,
    seller_stripe_account_id: sellerStripeAccountId,
  };
}

/**
 * After Stripe Checkout redirects back, confirm payment and record purchase globally.
 */
export async function GET(request: Request) {
  if (!isStripeConnectConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }

  const params = new URL(request.url).searchParams;
  const sessionId = params.get("session_id")?.trim();
  const sellerUsername = params.get("seller_username")?.trim().toLowerCase();

  if (!sessionId) {
    return NextResponse.json({ error: "session_id is required" }, { status: 400 });
  }

  const stripe = getStripe()!;

  let sellerAccountId: string | null = null;
  if (sellerUsername) {
    const connect = await getConnectAccount(sellerUsername);
    sellerAccountId = connect?.stripe_account_id ?? null;
  }

  let session: Stripe.Checkout.Session | null = null;

  if (sellerAccountId) {
    try {
      session = await stripe.checkout.sessions.retrieve(
        sessionId,
        {},
        { stripeAccount: sellerAccountId }
      );
    } catch {
      session = null;
    }
  }

  if (!session) {
    return NextResponse.json(
      { error: "Could not load checkout session. Pass seller_username from the listing." },
      { status: 404 }
    );
  }

  if (session.payment_status !== "paid" && session.status !== "complete") {
    return NextResponse.json({ error: "Checkout not completed" }, { status: 402 });
  }

  const postId = session.metadata?.uorpg_post_id;
  const buyerUsername = session.metadata?.uorpg_buyer_username;

  if (postId && buyerUsername) {
    const already = await hasPlatformPurchase(buyerUsername, postId);
    if (already) {
      return NextResponse.json({
        already_recorded: true,
        post_id: postId,
        buyer_username: buyerUsername,
      });
    }
  }

  const result = await recordFromSession(session, sellerAccountId!);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
