import { NextResponse } from "next/server";

/** Live platform JSON — never cache at CDN or browser. */
export function jsonLiveContent<T>(payload: T, init?: ResponseInit): NextResponse {
  return NextResponse.json(payload, {
    ...init,
    headers: {
      "Cache-Control": "private, no-store, max-age=0, must-revalidate",
      ...(init?.headers ?? {}),
    },
  });
}
