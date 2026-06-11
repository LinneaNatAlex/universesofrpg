"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { useAdmin } from "@/hooks/useAdmin";
import {
  DEMO_PERSONAS,
  getPersonaByUsername,
  PERSONA_STORAGE_KEY,
} from "@/lib/personas";
import type { Profile } from "@/types/database";

interface PersonaContextValue {
  personas: Profile[];
  activePersona: Profile | null;
  setActivePersona: (username: string) => void;
  canSwitch: boolean;
  ready: boolean;
  /** True while admin switched persona but the profile URL has not caught up yet. */
  isPersonaSwitchInProgress: (profileUsername: string) => boolean;
}

const PersonaContext = createContext<PersonaContextValue | null>(null);

function readSavedPersona(): string | null {
  if (typeof window === "undefined") return null;
  const saved = localStorage.getItem(PERSONA_STORAGE_KEY);
  if (saved && getPersonaByUsername(saved)) {
    return saved.toLowerCase();
  }
  return null;
}

export function PersonaProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAdmin, isLoggedIn, loading } = useAdmin();
  const [username, setUsername] = useState<string | null>(null);
  const [switchTarget, setSwitchTarget] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const canSwitch = isAdmin && isLoggedIn;

  useEffect(() => {
    if (!switchTarget) return;
    const profilePath = `/profile/${switchTarget}`;
    if (pathname === profilePath || pathname.startsWith(`${profilePath}/`)) {
      setSwitchTarget(null);
    }
  }, [pathname, switchTarget]);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || loading) return;

    if (!canSwitch) return;

    setUsername((current) => {
      if (current && getPersonaByUsername(current)) return current;

      const saved = readSavedPersona();
      if (saved) return saved;

      const fallback = DEMO_PERSONAS[0]?.username.toLowerCase() ?? null;
      if (fallback) {
        localStorage.setItem(PERSONA_STORAGE_KEY, fallback);
      }
      return fallback;
    });
  }, [canSwitch, loading, ready]);

  const setActivePersona = useCallback(
    (next: string) => {
      if (!canSwitch) return;
      const persona = getPersonaByUsername(next);
      if (!persona) return;
      const key = persona.username.toLowerCase();
      setSwitchTarget(key);
      setUsername(key);
      localStorage.setItem(PERSONA_STORAGE_KEY, key);
    },
    [canSwitch]
  );

  const isPersonaSwitchInProgress = useCallback(
    (profileUsername: string) => {
      if (!switchTarget) return false;
      return profileUsername.toLowerCase() !== switchTarget;
    },
    [switchTarget]
  );

  const activePersona = useMemo(() => {
    if (!canSwitch || !username) return null;
    return getPersonaByUsername(username) ?? null;
  }, [canSwitch, username]);

  const value = useMemo(
    () => ({
      personas: DEMO_PERSONAS,
      activePersona,
      setActivePersona,
      canSwitch,
      ready,
      isPersonaSwitchInProgress,
    }),
    [activePersona, setActivePersona, canSwitch, ready, isPersonaSwitchInProgress]
  );

  return (
    <PersonaContext.Provider value={value}>{children}</PersonaContext.Provider>
  );
}

export function usePersona(): PersonaContextValue {
  const ctx = useContext(PersonaContext);
  if (!ctx) {
    throw new Error("usePersona must be used within PersonaProvider");
  }
  return ctx;
}
