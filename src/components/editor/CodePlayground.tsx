"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Eye, Code2, Lock } from "lucide-react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-ink-muted text-sm font-comic">
      Loading editor…
    </div>
  ),
});

type Tab = "html" | "css" | "js";

const DEFAULT_HTML = `<div class="hero">
  <h1>Lyra Moonwhisper</h1>
  <p class="class">Arcane Weaver · Level 42</p>
</div>`;

const DEFAULT_CSS = `.hero {
  padding: 2rem;
  border: 3px solid #e63946;
  background: #1d3557;
  color: #f1faee;
  font-family: Georgia, serif;
  text-align: center;
}
.class { color: #ffd60a; }`;

const DEFAULT_JS = `// Interactive RPG elements`;

interface CodePlaygroundProps {
  loggedIn?: boolean;
}

export function CodePlayground({ loggedIn = false }: CodePlaygroundProps) {
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
          <Code2 className="h-5 w-5 text-comic-red" />
          <h2 className="font-comic text-xl text-ink">Code Forge</h2>
        </div>
        {loggedIn && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCodeLocked(!codeLocked)}
            >
              <Lock className="h-4 w-4 mr-1" />
              {codeLocked ? "Pay to unlock" : "Code visible"}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowPreview(!showPreview)}>
              <Eye className="h-4 w-4 mr-1" />
              {showPreview ? "Hide preview" : "Show preview"}
            </Button>
            <Button
              variant="comic"
              size="sm"
              onClick={() => alert("Published (Supabase wiring coming next).")}
            >
              Publish template
            </Button>
          </div>
        )}
      </div>

      <div className={`grid gap-4 ${showPreview ? "lg:grid-cols-2" : "grid-cols-1"}`}>
        <Card className="overflow-hidden flex flex-col min-h-[480px]">
          <div className="flex border-b-2 border-ink">
            {(["html", "css", "js"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2.5 text-sm font-mono uppercase ${
                  tab === t
                    ? "bg-comic-yellow text-ink border-b-2 border-comic-red -mb-0.5"
                    : "text-ink-muted hover:bg-surface"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex-1 min-h-[400px]">
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
                readOnly: !loggedIn,
              }}
            />
          </div>
        </Card>

        {showPreview && (
          <Card className="overflow-hidden min-h-[480px] flex flex-col">
            <div className="comic-panel-header px-4 py-2 text-sm font-comic flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Live preview
            </div>
            <iframe
              title="Live preview"
              srcDoc={srcDoc}
              sandbox="allow-scripts"
              className="flex-1 w-full bg-white border-0 min-h-[400px]"
            />
          </Card>
        )}
      </div>
    </div>
  );
}
