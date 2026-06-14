import { Suspense } from "react";
import { AuthCallbackClient } from "@/components/auth/AuthCallbackClient";

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="comic-card w-full max-w-md p-8 text-center font-comic text-muted">
            Finishing sign-in…
          </div>
        </div>
      }
    >
      <div className="min-h-screen flex items-center justify-center px-4">
        <AuthCallbackClient />
      </div>
    </Suspense>
  );
}
