"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const MIN_SCALE = 0.85;
const MAX_SCALE = 2.5;

interface Transform {
  scale: number;
  x: number;
  y: number;
}

function touchDistance(touches: TouchList): number {
  if (touches.length < 2) return 0;
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.hypot(dx, dy);
}

export function usePinchPanZoom(enabled: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState<Transform>({ scale: 1, x: 0, y: 0 });
  const transformRef = useRef(transform);
  transformRef.current = transform;

  const gesture = useRef({
    mode: "none" as "none" | "pinch" | "pan",
    startDist: 0,
    startScale: 1,
    startX: 0,
    startY: 0,
    startPanX: 0,
    startPanY: 0,
  });

  const reset = useCallback(() => {
    setTransform({ scale: 1, x: 0, y: 0 });
    gesture.current.mode = "none";
  }, []);

  const zoomIn = useCallback(() => {
    setTransform((t) => ({ ...t, scale: Math.min(MAX_SCALE, t.scale + 0.2) }));
  }, []);

  const zoomOut = useCallback(() => {
    setTransform((t) => {
      const scale = Math.max(MIN_SCALE, t.scale - 0.2);
      if (scale <= 1.02) return { scale: 1, x: 0, y: 0 };
      return { ...t, scale };
    });
  }, []);

  useEffect(() => {
    if (!enabled) {
      reset();
      return;
    }

    const el = containerRef.current;
    if (!el) return;

    function onTouchStart(e: TouchEvent) {
      if (e.touches.length === 2) {
        gesture.current = {
          mode: "pinch",
          startDist: touchDistance(e.touches),
          startScale: transformRef.current.scale,
          startX: 0,
          startY: 0,
          startPanX: transformRef.current.x,
          startPanY: transformRef.current.y,
        };
      } else if (e.touches.length === 1 && transformRef.current.scale > 1.02) {
        gesture.current = {
          mode: "pan",
          startDist: 0,
          startScale: transformRef.current.scale,
          startX: e.touches[0].clientX,
          startY: e.touches[0].clientY,
          startPanX: transformRef.current.x,
          startPanY: transformRef.current.y,
        };
      }
    }

    function onTouchMove(e: TouchEvent) {
      const g = gesture.current;
      if (g.mode === "pinch" && e.touches.length === 2) {
        e.preventDefault();
        const dist = touchDistance(e.touches);
        if (g.startDist < 1) return;
        const scale = Math.min(
          MAX_SCALE,
          Math.max(MIN_SCALE, g.startScale * (dist / g.startDist))
        );
        setTransform((t) => ({ ...t, scale }));
        return;
      }

      if (g.mode === "pan" && e.touches.length === 1) {
        e.preventDefault();
        const dx = e.touches[0].clientX - g.startX;
        const dy = e.touches[0].clientY - g.startY;
        setTransform((t) => ({
          ...t,
          x: g.startPanX + dx,
          y: g.startPanY + dy,
        }));
      }
    }

    function onTouchEnd() {
      gesture.current.mode = "none";
      setTransform((t) => {
        if (t.scale <= 1.02) return { scale: 1, x: 0, y: 0 };
        return t;
      });
    }

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchEnd);

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [enabled, reset]);

  const isZoomed =
    transform.scale > 1.02 ||
    Math.abs(transform.x) > 2 ||
    Math.abs(transform.y) > 2;

  return {
    containerRef,
    transform,
    reset,
    zoomIn,
    zoomOut,
    isZoomed,
  };
}
