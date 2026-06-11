/**
 * One-time Stripe setup for verified creator subscription.
 *
 * Keys are read from .env.local only — never hardcode secrets in this file.
 *
 * Usage:
 *   1. Put STRIPE_SECRET_KEY=sk_test_... in .env.local
 *   2. npm run stripe:setup-verification
 *   3. Copy the printed STRIPE_VERIFICATION_PRICE_ID into .env.local
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Stripe from "stripe";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const ENV_PATH = resolve(ROOT, ".env.local");

const PRODUCT_NAME = "Verified creator";
const PRODUCT_METADATA_KEY = "uorpg_product";
const PRODUCT_METADATA_VALUE = "verified_creator_subscription";
const PRICE_CENTS = 900; // $9.00/month — keep in sync with src/lib/currency.ts

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(ENV_PATH);

const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
if (!secretKey) {
  console.error(
    "Missing STRIPE_SECRET_KEY.\n" +
      `Add it to ${ENV_PATH} (get test keys from https://dashboard.stripe.com/test/apikeys)`
  );
  process.exit(1);
}

if (!secretKey.startsWith("sk_test_") && !secretKey.startsWith("sk_live_")) {
  console.error("STRIPE_SECRET_KEY should start with sk_test_ or sk_live_.");
  process.exit(1);
}

const stripe = new Stripe(secretKey);

async function findExistingProduct() {
  const result = await stripe.products.search({
    query: `metadata['${PRODUCT_METADATA_KEY}']:'${PRODUCT_METADATA_VALUE}'`,
    limit: 1,
  });
  return result.data[0] ?? null;
}

async function findActiveMonthlyPrice(productId) {
  const prices = await stripe.prices.list({
    product: productId,
    active: true,
    limit: 20,
  });
  return (
    prices.data.find(
      (p) =>
        p.currency === "usd" &&
        p.unit_amount === PRICE_CENTS &&
        p.recurring?.interval === "month"
    ) ?? null
  );
}

async function main() {
  console.log("Stripe verified creator setup\n");

  let product = await findExistingProduct();

  if (product) {
    console.log(`Found existing product: ${product.id} (${product.name})`);
  } else {
    product = await stripe.products.create({
      name: PRODUCT_NAME,
      description:
        "Monthly subscription for the verified creator badge on Universes of RPG.",
      metadata: {
        [PRODUCT_METADATA_KEY]: PRODUCT_METADATA_VALUE,
      },
      default_price_data: {
        currency: "usd",
        unit_amount: PRICE_CENTS,
        recurring: { interval: "month" },
      },
    });
    console.log(`Created product: ${product.id}`);
  }

  let price =
    typeof product.default_price === "string"
      ? await stripe.prices.retrieve(product.default_price)
      : product.default_price;

  if (!price || price.unit_amount !== PRICE_CENTS) {
    price = await findActiveMonthlyPrice(product.id);
  }

  if (!price) {
    price = await stripe.prices.create({
      product: product.id,
      currency: "usd",
      unit_amount: PRICE_CENTS,
      recurring: { interval: "month" },
      metadata: {
        [PRODUCT_METADATA_KEY]: PRODUCT_METADATA_VALUE,
      },
    });
    console.log(`Created price: ${price.id}`);
  } else {
    console.log(`Using price: ${price.id} ($${(price.unit_amount / 100).toFixed(2)}/month)`);
  }

  console.log("\nAdd or update in .env.local:\n");
  console.log(`STRIPE_VERIFICATION_PRICE_ID=${price.id}`);
  console.log("\nAlso ensure you have:");
  console.log("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...");
  console.log("STRIPE_WEBHOOK_SECRET=whsec_...  (from stripe listen or Dashboard webhook)");
  console.log("\nDocs: https://docs.stripe.com/keys-best-practices");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
