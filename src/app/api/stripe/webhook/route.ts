import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { MARKETPLACE_PRODUCT_METADATA } from "@/lib/stripe-connect-config";
import { getStripe } from "@/lib/stripe-server";
import {
  mapStripeSubscriptionStatus,
  stripePeriodEndIso,
} from "@/lib/stripe-subscription-status";
import { recordPlatformPurchase } from "@/lib/marketplace-platform-store";

/**
 * Stripe webhook — activate / update / cancel verified-creator subscriptions.
 *
 * In Stripe Dashboard → Developers → Webhooks, listen for:
 * - checkout.session.completed (verification subscriptions + marketplace purchases)
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - invoice.payment_failed
 * - account.updated (Connect payout status)
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
      } else if (
        session.mode === "payment" &&
        session.metadata?.uorpg_product === MARKETPLACE_PRODUCT_METADATA
      ) {
        const postId = session.metadata.uorpg_post_id;
        const buyerUsername = session.metadata.uorpg_buyer_username;
        const sellerUsername = session.metadata.uorpg_seller_username;
        const platformFeeRaw = session.metadata.uorpg_platform_fee_cents;
        const platformFeeCents = platformFeeRaw
          ? Number.parseInt(platformFeeRaw, 10)
          : 0;
        const paymentIntentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id ?? null;

        if (postId && buyerUsername && sellerUsername) {
          try {
            await recordPlatformPurchase({
              buyer_username: buyerUsername,
              post_id: postId,
              seller_username: sellerUsername,
              amount_cents: session.amount_total ?? 0,
              platform_fee_cents: Number.isFinite(platformFeeCents) ? platformFeeCents : 0,
              stripe_checkout_session_id: session.id,
              stripe_payment_intent_id: paymentIntentId,
              purchased_at: new Date().toISOString(),
            });
            handled.marketplace_purchase = { post_id: postId, buyer_username: buyerUsername };
          } catch (err) {
            console.error("[webhook] marketplace purchase record failed", err);
          }
        }
      }
      break;
    }
    case "account.updated": {
      const account = event.data.object as Stripe.Account;
      handled.stripe_account_id = account.id;
      handled.charges_enabled = account.charges_enabled;
      handled.payouts_enabled = account.payouts_enabled;
      // Connect status refresh happens via /api/stripe/connect/status on return
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
