"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Strikethrough,
  Underline,
} from "lucide-react";
import { cn } from "@/lib/utils";

const FONT_FAMILIES = [
  { label: "Comic", value: "Comic Neue, cursive" },
  { label: "Serif", value: "Georgia, serif" },
  { label: "Sans", value: "system-ui, sans-serif" },
  { label: "Mono", value: "ui-monospace, monospace" },
] as const;

const FONT_SIZES = [
  { label: "Small", value: "0.875rem" },
  { label: "Normal", value: "1rem" },
  { label: "Large", value: "1.25rem" },
  { label: "X-Large", value: "1.5rem" },
] as const;

const BLOCK_STYLES = [
  { label: "Paragraph", value: "p" },
  { label: "Heading 1", value: "h1" },
  { label: "Heading 2", value: "h2" },
  { label: "Heading 3", value: "h3" },
] as const;

interface WritingRichEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

function ToolbarButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center border-2 border-ink bg-surface hover:bg-comic-yellow transition-colors"
    >
      {children}
    </button>
  );
}

export function WritingRichEditor({
  value,
  onChange,
  placeholder = "Your poem, letter, chapter, or prose…",
  className,
  minHeight = "16rem",
}: WritingRichEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (value !== el.innerHTML) {
      el.innerHTML = value || "";
    }
  }, [value]);

  const emitChange = useCallback(() => {
    onChange(editorRef.current?.innerHTML ?? "");
  }, [onChange]);

  const runCommand = useCallback(
    (command: string, val?: string) => {
      editorRef.current?.focus();
      document.execCommand(command, false, val);
      emitChange();
    },
    [emitChange]
  );

  const wrapSelectionStyle = useCallback(
    (style: Record<string, string>) => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
      const text = sel.toString();
      if (!text) return;
      const styleAttr = Object.entries(style)
        .map(([k, v]) => `${k}:${v}`)
        .join(";");
      runCommand("insertHTML", `<span style="${styleAttr}">${text}</span>`);
    },
    [runCommand]
  );

  return (
    <div className={cn("border-2 border-ink bg-surface", className)}>
      <div className="flex flex-wrap items-center gap-1.5 p-2 border-b-2 border-dashed border-ink bg-comic-yellow/25">
        <ToolbarButton label="Bold" onClick={() => runCommand("bold")}>
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Italic" onClick={() => runCommand("italic")}>
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Underline" onClick={() => runCommand("underline")}>
          <Underline className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Strikethrough" onClick={() => runCommand("strikeThrough")}>
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>

        <span className="w-px h-6 bg-ink/30 mx-0.5" aria-hidden />

        <ToolbarButton label="Align left" onClick={() => runCommand("justifyLeft")}>
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Align center" onClick={() => runCommand("justifyCenter")}>
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Align right" onClick={() => runCommand("justifyRight")}>
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>

        <span className="w-px h-6 bg-ink/30 mx-0.5" aria-hidden />

        <select
          aria-label="Text style"
          defaultValue="p"
          onChange={(e) => runCommand("formatBlock", `<${e.target.value}>`)}
          className="h-8 border-2 border-ink bg-surface px-2 text-xs font-comic max-w-[7.5rem]"
        >
          {BLOCK_STYLES.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          aria-label="Font family"
          defaultValue={FONT_FAMILIES[0].value}
          onChange={(e) => wrapSelectionStyle({ "font-family": e.target.value })}
          className="h-8 border-2 border-ink bg-surface px-2 text-xs font-comic max-w-[6.5rem]"
        >
          {FONT_FAMILIES.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          aria-label="Font size"
          defaultValue={FONT_SIZES[1].value}
          onChange={(e) => wrapSelectionStyle({ "font-size": e.target.value })}
          className="h-8 border-2 border-ink bg-surface px-2 text-xs font-comic max-w-[6rem]"
        >
          {FONT_SIZES.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={emitChange}
        data-placeholder={placeholder}
        className="writing-rich-editor px-3 py-3 text-sm leading-relaxed outline-none"
        style={{ minHeight }}
      />
    </div>
  );
}
