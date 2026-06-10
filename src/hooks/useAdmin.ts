"use client";

import { useAuth } from "@/hooks/useAuth";
import { isAdminUser } from "@/lib/admin";

export function useAdmin() {
  const { user, loading, isLoggedIn } = useAuth();
  const isAdmin = isAdminUser(user);

  return { user, loading, isLoggedIn, isAdmin };
}
