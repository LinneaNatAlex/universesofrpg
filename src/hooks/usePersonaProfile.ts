"use client";

import { useEffect, useState } from "react";
import {
  getPersonaProfilePage,
  subscribePersonaProfiles,
} from "@/lib/persona-profile-store";
import type { PersonaProfilePage } from "@/types/database";

export function usePersonaProfile(username: string): PersonaProfilePage | undefined {
  const [page, setPage] = useState<PersonaProfilePage | undefined>(() =>
    getPersonaProfilePage(username)
  );

  useEffect(() => {
    const refresh = () => setPage(getPersonaProfilePage(username));
    refresh();
    return subscribePersonaProfiles(refresh);
  }, [username]);

  return page;
}
