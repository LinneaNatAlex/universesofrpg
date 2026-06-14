"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Music2, Pause, Play } from "lucide-react";
import {
  createYouTubeBackgroundPlayer,
  resolveThemeMusicSource,
  type YouTubePlayerInstance,
} from "@/lib/theme-music";
import { cn } from "@/lib/utils";

interface TemplateThemeMusicProps {
  url: string | null | undefined;
  className?: string;
}

/** Ambient theme music — outside the template iframe, not part of the sold layout. */
export function TemplateThemeMusic({ url, className }: TemplateThemeMusicProps) {
  const source = useMemo(() => resolveThemeMusicSource(url), [url]);
  const audioRef = useRef<HTMLAudioElement>(null);
  const ytContainerRef = useRef<HTMLDivElement>(null);
  const ytPlayerRef = useRef<YouTubePlayerInstance | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(source.kind === "youtube");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (source.kind !== "youtube" || !ytContainerRef.current) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setPlaying(false);

    void createYouTubeBackgroundPlayer(ytContainerRef.current, source.videoId, {
      onPlayingChange: (next) => {
        if (!cancelled) setPlaying(next);
      },
      onError: () => {
        if (!cancelled) {
          setError("Could not load this YouTube track.");
          setLoading(false);
        }
      },
    })
      .then((player) => {
        if (cancelled) {
          player.destroy();
          return;
        }
        ytPlayerRef.current = player;
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not load this YouTube track.");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      ytPlayerRef.current?.destroy();
      ytPlayerRef.current = null;
    };
  }, [source]);

  if (source.kind === "invalid") return null;

  async function toggleAudioPlayback() {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (playing) {
        audio.pause();
        setPlaying(false);
        return;
      }
      setError(null);
      await audio.play();
      setPlaying(true);
    } catch {
      setError("Could not play this audio link. Use a direct .mp3/.wav URL.");
      setPlaying(false);
    }
  }

  function toggleYouTubePlayback() {
    const player = ytPlayerRef.current;
    if (!player) return;

    try {
      if (playing) {
        player.pauseVideo();
        setPlaying(false);
      } else {
        setError(null);
        player.playVideo();
        setPlaying(true);
      }
    } catch {
      setError("Could not play this YouTube track.");
      setPlaying(false);
    }
  }

  function togglePlayback() {
    if (source.kind === "youtube") {
      toggleYouTubePlayback();
      return;
    }
    void toggleAudioPlayback();
  }

  const label =
    source.kind === "youtube" ? "YouTube theme music" : "Theme music";

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-2 px-3 py-2 border-t-2 border-dashed border-ink bg-comic-yellow/20",
        className
      )}
    >
      <Music2 className="h-4 w-4 text-comic-red shrink-0" aria-hidden />
      <span className="text-[11px] font-comic text-ink-muted uppercase tracking-wide">
        {label}
      </span>
      <button
        type="button"
        onClick={togglePlayback}
        disabled={loading || Boolean(error)}
        className="inline-flex items-center gap-1.5 px-3 py-1 border-2 border-ink bg-surface font-comic text-xs hover:bg-comic-yellow shadow-[2px_2px_0_#1a1a2e] transition-colors disabled:opacity-50"
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
            {loading ? "Loading…" : "Play"}
          </>
        )}
      </button>
      {error && (
        <p className="w-full text-center text-[11px] text-comic-red font-comic">
          {error}
        </p>
      )}
      {source.kind === "audio" && (
        <audio
          ref={audioRef}
          src={source.url}
          loop
          preload="metadata"
          className="sr-only"
          onEnded={() => setPlaying(false)}
          onPause={() => setPlaying(false)}
          onPlay={() => setPlaying(true)}
          onError={() => {
            setError("Could not load this audio link. Use a direct .mp3/.wav URL.");
            setPlaying(false);
          }}
        />
      )}
      {source.kind === "youtube" && (
        <div
          ref={ytContainerRef}
          className="absolute w-px h-px overflow-hidden opacity-0 pointer-events-none"
          aria-hidden
        />
      )}
    </div>
  );
}
