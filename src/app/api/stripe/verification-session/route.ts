import { NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  mapStripeSubscriptionStatus,
  stripePeriodEndIso,
} from "@/lib/stripe-subscription-status";
import { getStripe } from "@/lib/stripe-server";
import { VERIFICATION_SUBSCRIPTION_CENTS } from "@/lib/currency";

/**
 * After Stripe Checkout redirects back, the client calls this to confirm payment
 * and receive subscription details to store locally (until Supabase sync exists).
 */
export async function GET(request: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }

  const sessionId = new URL(request.url).searchParams.get("session_id")?.trim();
  if (!sessionId) {
    return NextResponse.json({ error: "session_id is required" }, { status: 400 });
  }

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });
  } catch {
    return NextResponse.json({ error: "Invalid checkout session" }, { status: 404 });
  }

  if (session.mode !== "subscription") {
    return NextResponse.json({ error: "Not a subscription checkout" }, { status: 400 });
  }

  if (session.payment_status !== "paid" && session.status !== "complete") {
    return NextResponse.json({ error: "Checkout not completed" }, { status: 402 });
  }

  const subRef = session.subscription;
  const subscription =
    typeof subRef === "string"
      ? await stripe.subscriptions.retrieve(subRef)
      : subRef;

  if (!subscription) {
    return NextResponse.json({ error: "Subscription missing" }, { status: 404 });
  }

  const username = (
    session.metadata?.uorpg_username ??
    subscription.metadata?.uorpg_username ??
    session.client_reference_id ??
    ""
  )
    .trim()
    .toLowerCase();

  const product = session.metadata?.uorpg_product ?? subscription.metadata?.uorpg_product;
  if (product && product !== "verified_creator_subscription") {
    return NextResponse.json({ error: "Unknown product" }, { status: 400 });
  }

  const customerEmail =
    session.customer_details?.email?.trim() ||
    session.customer_email?.trim() ||
    null;

  const status = mapStripeSubscriptionStatus(subscription.status);
  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id ?? null;

  return NextResponse.json({
    username: username || null,
    customer_email: customerEmail,
    amount_cents: VERIFICATION_SUBSCRIPTION_CENTS,
    status,
    current_period_end: stripePeriodEndIso(subscription),
    stripe_subscription_id: subscription.id,
    stripe_customer_id: customerId,
  });
}
