"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutPreview } from "@/components/content/LayoutPreview";
import { savePersonaProfilePage } from "@/lib/persona-profile-store";
import { injectThemeMusic } from "@/lib/template-preview";
import { Button } from "@/components/ui/button";
import type { PersonaPageMode, PersonaProfilePage } from "@/types/database";
import { ArrowLeft } from "lucide-react";

interface PersonaProfileEditorProps {
  username: string;
  displayName: string;
  initial?: PersonaProfilePage;
}

const DEFAULT_CODE_HTML = `<div class="persona">
  <h1>Your Name</h1>
  <p class="tagline">Class · Level · Realm</p>
  <p class="bio">A short RPG persona intro visitors see first.</p>
</div>`;

const DEFAULT_CODE_CSS = `.persona {
  padding: 2rem;
  border: 3px solid #e63946;
  background: #1d3557;
  color: #f1faee;
  font-family: Georgia, serif;
  text-align: center;
  max-width: 480px;
  margin: 0 auto;
}
.tagline { color: #ffd60a; }`;

export function PersonaProfileEditor({
  username,
  displayName,
  initial,
}: PersonaProfileEditorProps) {
  const router = useRouter();
  const [mode, setMode] = useState<PersonaPageMode>(initial?.mode ?? "text");
  const [html, setHtml] = useState(initial?.html_code ?? DEFAULT_CODE_HTML);
  const [css, setCss] = useState(initial?.css_code ?? DEFAULT_CODE_CSS);
  const [js, setJs] = useState(initial?.js_code ?? "");
  const [textContent, setTextContent] = useState(
    initial?.text_content ??
      `${displayName}\n\nWrite your RPG persona — backstory, stats, mood, and what you create on Universes of RPG.`
  );
  const [musicUrl, setMusicUrl] = useState(initial?.music_url ?? "");
  const [saved, setSaved] = useState(false);

  const previewHtml = injectThemeMusic(html, musicUrl);

  function handleSave() {
    savePersonaProfilePage({
      username,
      mode,
      html_code: mode === "code" ? html : null,
      css_code: mode === "code" ? css : null,
      js_code: mode === "code" ? js || null : null,
      text_content: mode === "text" ? textContent : null,
      music_url: musicUrl.trim() || null,
    });
    setSaved(true);
    router.push(`/profile/${username}`);
    router.refresh();
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Link
        href={`/profile/${username}`}
        className="inline-flex items-center gap-1 text-sm font-comic text-ink-muted hover:text-comic-red"
      >
        <ArrowLeft className="h-4 w-4" /> Back to profile
      </Link>

      <header>
        <h1 className="font-comic text-2xl text-ink">Edit persona page</h1>
        <p className="text-sm text-ink-muted mt-1">
          This is the first tab visitors see on @{username}. Code or text — your RPG identity.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: "text" as const, label: "Text persona" },
            { id: "code" as const, label: "Coded profile" },
          ] as const
        ).map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setMode(id)}
            className={`px-4 py-2 font-comic text-sm border-2 border-ink ${
              mode === id
                ? "bg-comic-red text-white shadow-[2px_2px_0_#1a1a2e]"
                : "bg-surface hover:bg-comic-yellow"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="comic-panel p-4">
        <label className="block font-comic text-sm text-ink mb-1">
          Theme music URL (optional)
        </label>
        <input
          value={musicUrl}
          onChange={(e) => setMusicUrl(e.target.value)}
          className="w-full border-2 border-ink bg-surface px-3 py-2 text-sm"
          placeholder="https://…/theme.mp3"
        />
      </div>

      {mode === "text" ? (
        <div className="comic-panel p-4 space-y-2">
          <label className="font-comic text-sm text-ink">Persona text</label>
          <textarea
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            rows={14}
            className="w-full border-2 border-ink bg-surface px-3 py-2 text-sm leading-relaxed"
            placeholder="Your character sheet in prose, lore, quotes…"
          />
        </div>
      ) : (
        <div className="space-y-4">
          {(["html", "css", "js"] as const).map((field) => (
            <div key={field} className="comic-panel p-4 space-y-2">
              <label className="font-comic text-sm text-ink uppercase">{field}</label>
              <textarea
                value={field === "html" ? html : field === "css" ? css : js}
                onChange={(e) => {
                  if (field === "html") setHtml(e.target.value);
                  else if (field === "css") setCss(e.target.value);
                  else setJs(e.target.value);
                }}
                rows={field === "js" ? 4 : 8}
                className="w-full border-2 border-ink bg-surface px-3 py-2 text-xs font-mono"
              />
            </div>
          ))}
          <LayoutPreview html={previewHtml} css={css} js={js} mode="full" />
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Button variant="comic" onClick={handleSave}>
          Save persona page
        </Button>
        {saved && (
          <span className="text-sm font-comic text-ink-muted self-center">Saved!</span>
        )}
      </div>
    </div>
  );
}
