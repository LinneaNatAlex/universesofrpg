import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe-server";
import {
  mapStripeSubscriptionStatus,
  stripePeriodEndIso,
} from "@/lib/stripe-subscription-status";

/**
 * Stripe webhook — activate / update / cancel verified-creator subscriptions.
 *
 * In Stripe Dashboard → Developers → Webhooks, listen for:
 * - checkout.session.completed
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - invoice.payment_failed
 *
 * Persist subscription state to Supabase in production (not localStorage).
 * This handler returns 200 with a JSON summary for wiring tests.
 */
export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const rawBody = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const handled: Record<string, unknown> = { type: event.type };

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "subscription" && session.subscription) {
        const sub = await stripe.subscriptions.retrieve(String(session.subscription));
        handled.username = session.metadata?.uorpg_username ?? sub.metadata?.uorpg_username;
        handled.subscription_id = sub.id;
        handled.status = sub.status;
        handled.period_end = stripePeriodEndIso(sub);
        handled.mapped_status = mapStripeSubscriptionStatus(sub.status);
        // TODO: upsert to Supabase + grant/revoke verified badge server-side
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      handled.username = sub.metadata?.uorpg_username;
      handled.subscription_id = sub.id;
      handled.status = sub.status;
      handled.period_end = stripePeriodEndIso(sub);
      handled.mapped_status = mapStripeSubscriptionStatus(sub.status);
      // TODO: sync status; revoke verified badge if canceled and past period end
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subRef = (invoice as { subscription?: string | Stripe.Subscription | null })
        .subscription;
      handled.subscription_id =
        typeof subRef === "string" ? subRef : subRef?.id ?? null;
      handled.status = "past_due";
      break;
    }
    default:
      handled.ignored = true;
  }

  return NextResponse.json({ received: true, ...handled });
}
