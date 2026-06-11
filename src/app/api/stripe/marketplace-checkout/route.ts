import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/api-session-auth";
import {
  calculatePlatformFeeCents,
  getMarketplaceCurrency,
  MARKETPLACE_PRODUCT_METADATA,
} from "@/lib/stripe-connect-config";
import { getStripe, isStripeConnectConfigured } from "@/lib/stripe-server";
import { getConnectAccount } from "@/lib/marketplace-platform-store";

const MIN_PRICE_CENTS = 100;

export async function POST(request: Request) {
  if (!isStripeConnectConfigured()) {
    return NextResponse.json(
      { error: "Stripe is not configured for marketplace checkout." },
      { status: 503 }
    );
  }

  const auth = await requireSessionUser();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: {
    post_id?: string;
    title?: string;
    price_cents?: number;
    seller_username?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const postId = body.post_id?.trim();
  const title = body.title?.trim();
  const priceCents = body.price_cents;
  const sellerUsername = body.seller_username?.trim().toLowerCase();

  if (!postId || !title || !sellerUsername) {
    return NextResponse.json(
      { error: "post_id, title, and seller_username are required" },
      { status: 400 }
    );
  }

  if (typeof priceCents !== "number" || priceCents < MIN_PRICE_CENTS) {
    return NextResponse.json(
      { error: `price_cents must be at least ${MIN_PRICE_CENTS}` },
      { status: 400 }
    );
  }

  const buyerUsername = auth.user.username;
  if (buyerUsername === sellerUsername) {
    return NextResponse.json({ error: "You cannot buy your own listing." }, { status: 400 });
  }

  const sellerConnect = await getConnectAccount(sellerUsername);
  if (!sellerConnect?.stripe_account_id) {
    return NextResponse.json(
      { error: "This creator has not set up payouts yet." },
      { status: 422 }
    );
  }

  if (!sellerConnect.charges_enabled) {
    return NextResponse.json(
      { error: "This creator has not finished Stripe payout setup." },
      { status: 422 }
    );
  }

  const stripe = getStripe()!;
  const origin = new URL(request.url).origin;
  const platformFeeCents = calculatePlatformFeeCents(priceCents);

  const metadata = {
    uorpg_product: MARKETPLACE_PRODUCT_METADATA,
    uorpg_post_id: postId,
    uorpg_buyer_username: buyerUsername,
    uorpg_seller_username: sellerUsername,
    uorpg_platform_fee_cents: String(platformFeeCents),
  };

  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: getMarketplaceCurrency(),
            product_data: {
              name: title.slice(0, 120),
              metadata: { uorpg_post_id: postId },
            },
            unit_amount: priceCents,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: platformFeeCents,
        metadata,
      },
      success_url: `${origin}/post/${postId}?purchase=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/post/${postId}?purchase=canceled`,
      metadata,
    },
    { stripeAccount: sellerConnect.stripe_account_id }
  );

  return NextResponse.json({
    url: session.url,
    session_id: session.id,
    platform_fee_cents: platformFeeCents,
    seller_stripe_account_id: sellerConnect.stripe_account_id,
  });
}
