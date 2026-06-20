"use client";

import { AuthProvider } from "@/contexts/AuthContext";

export function RootProviders({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
