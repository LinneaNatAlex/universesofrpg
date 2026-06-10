"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Eye, Code2, Lock } from "lucide-react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-muted text-sm">
      Loading editor…
    </div>
  ),
});

type Tab = "html" | "css" | "js";

const DEFAULT_HTML = `<div class="hero">
  <h1>Lyra Moonwhisper</h1>
  <p class="class">Arcane Weaver · Level 42</p>
  <div class="stats">
    <span>INT 18</span>
    <span>WIS 16</span>
    <span>CHA 20</span>
  </div>
</div>`;

const DEFAULT_CSS = `body {
  margin: 0;
  font-family: Georgia, serif;
  background: #0f0a1a;
  color: #e9d5ff;
}

.hero {
  padding: 2rem;
  border: 2px solid #7c3aed;
  border-radius: 1rem;
  box-shadow: 0 0 30px rgba(124, 58, 237, 0.3);
  text-align: center;
}

.class { color: #22d3ee; }
.stats {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1rem;
}
.stats span {
  padding: 0.25rem 0.75rem;
  border: 1px solid #7c3aed55;
  border-radius: 999px;
  font-size: 0.85rem;
}`;

const DEFAULT_JS = `// Add interactive RPG elements here
document.querySelector('.hero')?.addEventListener('click', () => {
  console.log('Spell cast!');
});`;

export function CodePlayground() {
  const [tab, setTab] = useState<Tab>("html");
  const [html, setHtml] = useState(DEFAULT_HTML);
  const [css, setCss] = useState(DEFAULT_CSS);
  const [js, setJs] = useState(DEFAULT_JS);
  const [showPreview, setShowPreview] = useState(true);
  const [codeLocked, setCodeLocked] = useState(false);

  const srcDoc = `<!DOCTYPE html><html><head><style>${css}</style></head><body>${html}<script>${js}<\/script></body></html>`;

  const editorValue = tab === "html" ? html : tab === "css" ? css : js;
  const setEditorValue = (v: string) => {
    if (tab === "html") setHtml(v);
    else if (tab === "css") setCss(v);
    else setJs(v);
  };

  const language = tab === "js" ? "javascript" : tab;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Code2 className="h-5 w-5 text-violet-400" />
          <h2 className="text-xl font-semibold">Creation Forge</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCodeLocked(!codeLocked)}
            className={codeLocked ? "text-amber-400" : ""}
          >
            <Lock className="h-4 w-4 mr-1" />
            {codeLocked ? "Pay to unlock" : "Code visible"}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="h-4 w-4 mr-1" />
            {showPreview ? "Hide preview" : "Show preview"}
          </Button>
          <Button variant="glow" size="sm">
            Publish creation
          </Button>
        </div>
      </div>

      <div className={`grid gap-4 ${showPreview ? "lg:grid-cols-2" : "grid-cols-1"}`}>
        <Card className="overflow-hidden flex flex-col min-h-[480px]">
          <div className="flex border-b border-border">
            {(["html", "css", "js"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2.5 text-sm font-mono uppercase transition-colors ${
                  tab === t
                    ? "bg-violet-500/15 text-violet-300 border-b-2 border-violet-500"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex-1 min-h-[400px]">
            {codeLocked ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-muted p-8">
                <Lock className="h-10 w-10 text-amber-400/60" />
                <p className="text-sm text-center">
                  Source code is locked. Purchase to view and fork.
                </p>
              </div>
            ) : (
              <MonacoEditor
                language={language}
                value={editorValue}
                onChange={(v) => setEditorValue(v ?? "")}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  padding: { top: 12 },
                  scrollBeyondLastLine: false,
                }}
              />
            )}
          </div>
        </Card>

        {showPreview && (
          <Card className="overflow-hidden min-h-[480px] flex flex-col">
            <div className="border-b border-border px-4 py-2.5 text-sm text-muted flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Live preview
            </div>
            <iframe
              title="Live preview"
              srcDoc={srcDoc}
              sandbox="allow-scripts"
              className="flex-1 w-full bg-white/5 border-0 min-h-[400px]"
            />
          </Card>
        )}
      </div>
    </div>
  );
}
