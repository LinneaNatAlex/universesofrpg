"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
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
}

const PersonaContext = createContext<PersonaContextValue | null>(null);

export function PersonaProvider({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoggedIn, loading } = useAdmin();
  const [username, setUsername] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const canSwitch = isAdmin && isLoggedIn;

  useEffect(() => {
    const saved = localStorage.getItem(PERSONA_STORAGE_KEY);
    if (saved && getPersonaByUsername(saved)) {
      setUsername(saved);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (loading || !ready) return;

    if (!canSwitch) {
      setUsername(null);
      localStorage.removeItem(PERSONA_STORAGE_KEY);
      return;
    }

    if (!username && DEMO_PERSONAS[0]) {
      const defaultUsername = DEMO_PERSONAS[0].username;
      setUsername(defaultUsername);
      localStorage.setItem(PERSONA_STORAGE_KEY, defaultUsername);
    }
  }, [canSwitch, loading, ready, username]);

  const setActivePersona = useCallback(
    (next: string) => {
      if (!canSwitch) return;
      const persona = getPersonaByUsername(next);
      if (!persona) return;
      setUsername(persona.username);
      localStorage.setItem(PERSONA_STORAGE_KEY, persona.username);
    },
    [canSwitch]
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
    }),
    [activePersona, setActivePersona, canSwitch, ready]
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
