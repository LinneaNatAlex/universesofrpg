import { NextResponse } from "next/server";
import { getStripe, getVerificationPriceId, isStripeConfigured } from "@/lib/stripe-server";

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe is not configured. Use demo subscribe in local mode." },
      { status: 503 }
    );
  }

  const stripe = getStripe();
  const priceId = getVerificationPriceId();
  if (!stripe || !priceId) {
    return NextResponse.json({ error: "Stripe misconfigured" }, { status: 503 });
  }

  let body: { username?: string; email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const username = body.username?.trim().toLowerCase();
  const email = body.email?.trim();
  if (!username) {
    return NextResponse.json({ error: "username is required" }, { status: 400 });
  }

  const origin = new URL(request.url).origin;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/settings?tab=applications&verification=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/settings?tab=applications&verification=canceled`,
    customer_email: email || undefined,
    metadata: {
      uorpg_username: username,
      uorpg_product: "verified_creator_subscription",
    },
    subscription_data: {
      metadata: {
        uorpg_username: username,
        uorpg_product: "verified_creator_subscription",
      },
    },
  });

  return NextResponse.json({ url: session.url });
}
