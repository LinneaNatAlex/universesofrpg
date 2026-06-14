"use client";

import { useRef, useState } from "react";
import { Music2, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface TemplateThemeMusicProps {
  url: string | null | undefined;
  className?: string;
}

/** Ambient theme music — outside the template iframe, not part of the sold layout. */
export function TemplateThemeMusic({ url, className }: TemplateThemeMusicProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(false);
  const trimmed = url?.trim();

  if (!trimmed || error) return null;

  async function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      if (playing) {
        audio.pause();
        setPlaying(false);
        return;
      }
      await audio.play();
      setPlaying(true);
    } catch {
      setError(true);
      setPlaying(false);
    }
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 px-3 py-2 border-t-2 border-dashed border-ink bg-comic-yellow/20",
        className
      )}
    >
      <Music2 className="h-4 w-4 text-comic-red shrink-0" aria-hidden />
      <span className="text-[11px] font-comic text-ink-muted uppercase tracking-wide">
        Theme music
      </span>
      <button
        type="button"
        onClick={() => void togglePlayback()}
        className="inline-flex items-center gap-1.5 px-3 py-1 border-2 border-ink bg-surface font-comic text-xs hover:bg-comic-yellow shadow-[2px_2px_0_#1a1a2e] transition-colors"
        aria-pressed={playing}
      >
        {playing ? (
          <>
            <Pause className="h-3.5 w-3.5" />
            Pause
          </>
        ) : (
          <>
            <Play className="h-3.5 w-3.5" />
            Play
          </>
        )}
      </button>
      <audio
        ref={audioRef}
        src={trimmed}
        loop
        preload="metadata"
        className="sr-only"
        onEnded={() => setPlaying(false)}
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
      />
    </div>
  );
}
