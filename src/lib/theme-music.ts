/** Parse a YouTube watch, embed, Shorts, or youtu.be link into a video id. */
export function parseYouTubeVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;

  try {
    const url = new URL(
      trimmed.startsWith("http://") || trimmed.startsWith("https://")
        ? trimmed
        : `https://${trimmed}`
    );
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id && /^[\w-]{11}$/.test(id) ? id : null;
    }

    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "music.youtube.com" ||
      host.endsWith(".youtube.com")
    ) {
      const fromQuery = url.searchParams.get("v");
      if (fromQuery && /^[\w-]{11}$/.test(fromQuery)) return fromQuery;

      const parts = url.pathname.split("/").filter(Boolean);
      const marker = parts[0];
      if (
        (marker === "embed" || marker === "shorts" || marker === "live") &&
        parts[1] &&
        /^[\w-]{11}$/.test(parts[1])
      ) {
        return parts[1];
      }
    }
  } catch {
    return null;
  }

  return null;
}

export type ThemeMusicSource =
  | { kind: "youtube"; videoId: string }
  | { kind: "audio"; url: string }
  | { kind: "invalid" };

export function resolveThemeMusicSource(url: string | null | undefined): ThemeMusicSource {
  const trimmed = url?.trim() ?? "";
  if (!trimmed) return { kind: "invalid" };

  const videoId = parseYouTubeVideoId(trimmed);
  if (videoId) return { kind: "youtube", videoId };

  return { kind: "audio", url: trimmed };
}

export const THEME_MUSIC_HINT =
  "Direct .mp3/.wav link or a YouTube URL (watch, youtu.be, or Shorts). Background music starts automatically — use Pause if you want silence.";

export function themeMusicPauseKey(source: ThemeMusicSource): string | null {
  if (source.kind === "invalid") return null;
  if (source.kind === "youtube") return `yt:${source.videoId}`;
  return `audio:${source.url}`;
}

export function isThemeMusicPausedByUser(key: string | null): boolean {
  if (!key || typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(`uorpg-music-pause:${key}`) === "1";
  } catch {
    return false;
  }
}

export function setThemeMusicPausedByUser(key: string | null, paused: boolean): void {
  if (!key || typeof window === "undefined") return;
  try {
    if (paused) {
      sessionStorage.setItem(`uorpg-music-pause:${key}`, "1");
    } else {
      sessionStorage.removeItem(`uorpg-music-pause:${key}`);
    }
  } catch {
    // Private browsing / storage blocked.
  }
}

let youtubeApiPromise: Promise<void> | null = null;

/** Load the YouTube IFrame API once (needed for theme music from YouTube links). */
export function loadYouTubeIframeApi(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("YouTube API requires a browser"));
  }

  if (window.YT?.Player) return Promise.resolve();
  if (youtubeApiPromise) return youtubeApiPromise;

  youtubeApiPromise = new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(new Error("YouTube API load timeout"));
    }, 15_000);

    const finish = () => {
      window.clearTimeout(timeout);
      resolve();
    };

    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      finish();
    };

    if (document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const poll = window.setInterval(() => {
        if (window.YT?.Player) {
          window.clearInterval(poll);
          finish();
        }
      }, 100);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () => {
      window.clearTimeout(timeout);
      youtubeApiPromise = null;
      reject(new Error("YouTube API script failed"));
    };
    document.head.appendChild(script);
  });

  return youtubeApiPromise;
}

export type YouTubePlayerInstance = {
  playVideo: () => void;
  pauseVideo: () => void;
  destroy: () => void;
};

export function createYouTubeBackgroundPlayer(
  container: HTMLElement,
  videoId: string,
  handlers: {
    onReady?: () => void;
    onError?: () => void;
    onPlayingChange?: (playing: boolean) => void;
  }
): Promise<YouTubePlayerInstance> {
  return loadYouTubeIframeApi().then(
    () =>
      new Promise((resolve, reject) => {
        if (!window.YT?.Player) {
          reject(new Error("YouTube Player unavailable"));
          return;
        }

        let player: YouTubePlayerInstance | null = null;

        const instance = new window.YT.Player(container, {
          videoId,
          height: "1",
          width: "1",
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            loop: 1,
            modestbranding: 1,
            playsinline: 1,
            playlist: videoId,
            rel: 0,
          },
          events: {
            onReady: () => {
              player = {
                playVideo: () => instance.playVideo(),
                pauseVideo: () => instance.pauseVideo(),
                destroy: () => instance.destroy(),
              };
              handlers.onReady?.();
              resolve(player);
            },
            onError: () => {
              handlers.onError?.();
              reject(new Error("YouTube playback error"));
            },
            onStateChange: (event: { data: number }) => {
              const YT = window.YT!;
              if (event.data === YT.PlayerState.PLAYING) {
                handlers.onPlayingChange?.(true);
              } else if (
                event.data === YT.PlayerState.PAUSED ||
                event.data === YT.PlayerState.ENDED
              ) {
                handlers.onPlayingChange?.(false);
              }
            },
          },
        });
      })
  );
}

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: HTMLElement,
        options: Record<string, unknown>
      ) => {
        playVideo: () => void;
        pauseVideo: () => void;
        destroy: () => void;
      };
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}
