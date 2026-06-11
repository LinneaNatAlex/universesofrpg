import type { PersonaProfilePage } from "@/types/database";

const MOCK_PERSONA_PAGES: PersonaProfilePage[] = [
  {
    username: "lyra_weaver",
    mode: "code",
    html_code: `<div class="persona">
  <h1>Lyra Moonwhisper</h1>
  <p class="title">Arcane Weaver · Level 42</p>
  <p class="lore">Weaving rune-lit interfaces for RPG personas across the multiverse.</p>
  <ul class="stats">
    <li><span>INT</span><strong>18</strong></li>
    <li><span>CHA</span><strong>16</strong></li>
    <li><span>ARC</span><strong>20</strong></li>
  </ul>
</div>`,
    css_code: `.persona {
  padding: 2rem;
  border: 3px solid #e63946;
  border-radius: 6px;
  background: linear-gradient(160deg, #1d3557, #0f1c30);
  color: #f1faee;
  font-family: Georgia, serif;
  text-align: center;
  max-width: 420px;
  margin: 0 auto;
}
.persona h1 { margin: 0; font-size: 1.75rem; }
.title { color: #ffd60a; margin: 0.5rem 0 1rem; }
.lore { font-size: 0.9rem; opacity: 0.9; line-height: 1.5; }
.stats {
  list-style: none;
  padding: 0;
  margin: 1.5rem 0 0;
  display: flex;
  justify-content: center;
  gap: 1.5rem;
}
.stats span { display: block; font-size: 0.65rem; opacity: 0.7; letter-spacing: 0.1em; }
.stats strong { font-size: 1.25rem; color: #ffd60a; }`,
    js_code: null,
    text_content: null,
    music_url: null,
    updated_at: new Date().toISOString(),
  },
  {
    username: "hollowscribe",
    mode: "text",
    html_code: null,
    css_code: null,
    js_code: null,
    text_content: `Hollow Scribe — Keeper of the Gate

Era: Victorian gothic · Location: Blackfen Woods

I chronicle slow-burn horror campaigns and review story arcs before they reach the Shop. My table runs on lantern light, sanity rolls, and prose that earns its dread.

Currently seeking: collaborative horror threads, melancholy character studies, and editors who read every line.`,
    music_url: null,
    updated_at: new Date().toISOString(),
  },
  {
    username: "roninforge",
    mode: "code",
    html_code: `<div class="ronin">
  <h1>Ronin Forge</h1>
  <p>Cyber-samurai character smith · Neo-Kyoto '12</p>
  <div class="blade">Neural Blade: ONLINE</div>
</div>`,
    css_code: `.ronin {
  padding: 2rem;
  background: #0a0a12;
  color: #00f5d4;
  border: 2px solid #00f5d4;
  font-family: monospace;
  text-align: center;
  box-shadow: 0 0 24px rgba(0,245,212,0.25);
}
.ronin h1 { color: #fff; margin: 0 0 0.5rem; }
.blade {
  margin-top: 1.25rem;
  padding: 0.5rem 1rem;
  border: 1px dashed #00f5d4;
  display: inline-block;
  font-size: 0.75rem;
}`,
    js_code: null,
    text_content: null,
    music_url: null,
    updated_at: new Date().toISOString(),
  },
];

let pages: PersonaProfilePage[] = [...MOCK_PERSONA_PAGES];
let storageLoaded = false;

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l());
}

function storageKey() {
  return "uorpg-persona-pages";
}

function loadFromStorage(): PersonaProfilePage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey());
    return raw ? (JSON.parse(raw) as PersonaProfilePage[]) : [];
  } catch {
    return [];
  }
}

function ensurePagesLoaded() {
  if (typeof window === "undefined" || storageLoaded) return;
  storageLoaded = true;
  mergeStored();
}

function persistCustom(pagesList: PersonaProfilePage[]) {
  if (typeof window === "undefined") return;
  const mockUsernames = new Set(MOCK_PERSONA_PAGES.map((p) => p.username.toLowerCase()));
  const custom = pagesList.filter((p) => !mockUsernames.has(p.username.toLowerCase()));
  const overrides = pagesList.filter((p) => {
    const isMock = mockUsernames.has(p.username.toLowerCase());
    if (!isMock) return false;
    const original = MOCK_PERSONA_PAGES.find(
      (m) => m.username.toLowerCase() === p.username.toLowerCase()
    );
    return JSON.stringify(p) !== JSON.stringify(original);
  });
  localStorage.setItem(storageKey(), JSON.stringify([...custom, ...overrides]));
}

function mergeStored() {
  const stored = loadFromStorage();
  const map = new Map(pages.map((p) => [p.username.toLowerCase(), p]));
  for (const s of stored) {
    map.set(s.username.toLowerCase(), s);
  }
  pages = [...map.values()];
}

export function subscribePersonaProfiles(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getPersonaProfilePage(username: string): PersonaProfilePage | undefined {
  ensurePagesLoaded();
  return pages.find((p) => p.username.toLowerCase() === username.toLowerCase());
}

export type SavePersonaProfileInput = Omit<PersonaProfilePage, "updated_at">;

export function savePersonaProfilePage(input: SavePersonaProfileInput): PersonaProfilePage {
  const page: PersonaProfilePage = {
    ...input,
    username: input.username.toLowerCase(),
    updated_at: new Date().toISOString(),
  };

  const idx = pages.findIndex((p) => p.username.toLowerCase() === page.username);
  if (idx === -1) pages.push(page);
  else pages[idx] = page;

  persistCustom(pages);
  notify();
  return page;
}
