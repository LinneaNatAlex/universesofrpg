import { Suspense } from "react";
import { CompleteProfileClient } from "@/components/auth/CompleteProfileClient";

export default function CompleteProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="comic-card w-full max-w-md p-8 text-center font-comic text-muted">
          Loading…
        </div>
      }
    >
      <CompleteProfileClient />
    </Suspense>
  );
}
