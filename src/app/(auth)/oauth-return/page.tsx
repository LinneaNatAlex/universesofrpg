import { Suspense } from "react";
import { OAuthReturnClient } from "@/components/auth/OAuthReturnClient";

export default function OAuthReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="comic-card w-full max-w-md p-8 text-center font-comic text-muted">
          Finishing sign-in…
        </div>
      }
    >
      <OAuthReturnClient />
    </Suspense>
  );
}
