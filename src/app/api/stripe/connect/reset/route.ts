import { NextResponse } from "next/server";
import { resolveSellerUsername } from "@/lib/api-session-auth";
import { deleteConnectAccount } from "@/lib/marketplace-platform-store";

export async function POST(request: Request) {
  let body: { acting_username?: string } = {};
  try {
    body = await request.json();
  } catch {
    // empty body is fine
  }

  const auth = await resolveSellerUsername(body.acting_username);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    await deleteConnectAccount(auth.sellerUsername);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not reset payout setup.";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    username: auth.sellerUsername,
    message: "Payout setup cleared. Pick your country and click Set up payouts again.",
  });
}
