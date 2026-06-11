"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const MIN_SCALE = 0.85;
const MAX_SCALE = 2.5;
const PAN_THRESHOLD_PX = 8;

interface Transform {
  scale: number;
  x: number;
  y: number;
}

interface UsePinchPanZoomOptions {
  /** Allow drag-to-pan at 1× zoom (explore wide/tall templates). */
  panAtBaseScale?: boolean;
}

function touchDistance(touches: TouchList): number {
  if (touches.length < 2) return 0;
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.hypot(dx, dy);
}

export function usePinchPanZoom(
  enabled: boolean,
  options: UsePinchPanZoomOptions = {}
) {
  const { panAtBaseScale = false } = options;
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState<Transform>({ scale: 1, x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const transformRef = useRef(transform);
  transformRef.current = transform;

  const gesture = useRef({
    mode: "none" as "none" | "pinch" | "pan" | "pending",
    startDist: 0,
    startScale: 1,
    startX: 0,
    startY: 0,
    startPanX: 0,
    startPanY: 0,
    pointerId: -1,
  });

  const reset = useCallback(() => {
    setTransform({ scale: 1, x: 0, y: 0 });
    setIsPanning(false);
    gesture.current.mode = "none";
    gesture.current.pointerId = -1;
  }, []);

  const zoomIn = useCallback(() => {
    setTransform((t) => ({ ...t, scale: Math.min(MAX_SCALE, t.scale + 0.2) }));
  }, []);

  const zoomOut = useCallback(() => {
    setTransform((t) => {
      const scale = Math.max(MIN_SCALE, t.scale - 0.2);
      if (scale <= 1.02 && !panAtBaseScale) {
        return { scale: 1, x: 0, y: 0 };
      }
      if (scale <= 1.02) return { ...t, scale: 1 };
      return { ...t, scale };
    });
  }, [panAtBaseScale]);

  const canPan = useCallback(
    (scale: number) => panAtBaseScale || scale > 1.02,
    [panAtBaseScale]
  );

  useEffect(() => {
    if (!enabled) {
      reset();
      return;
    }

    const el = containerRef.current;
    if (!el) return;

    function beginPan(clientX: number, clientY: number, pointerId = -1) {
      gesture.current = {
        mode: "pan",
        startDist: 0,
        startScale: transformRef.current.scale,
        startX: clientX,
        startY: clientY,
        startPanX: transformRef.current.x,
        startPanY: transformRef.current.y,
        pointerId,
      };
      setIsPanning(true);
    }

    function beginPendingPan(clientX: number, clientY: number, pointerId = -1) {
      gesture.current = {
        mode: "pending",
        startDist: 0,
        startScale: transformRef.current.scale,
        startX: clientX,
        startY: clientY,
        startPanX: transformRef.current.x,
        startPanY: transformRef.current.y,
        pointerId,
      };
    }

    function movePan(clientX: number, clientY: number) {
      const g = gesture.current;
      if (g.mode === "pending") {
        const dx = clientX - g.startX;
        const dy = clientY - g.startY;
        if (Math.hypot(dx, dy) < PAN_THRESHOLD_PX) return;
        if (!canPan(g.startScale)) {
          gesture.current.mode = "none";
          return;
        }
        beginPan(g.startX, g.startY, g.pointerId);
      }

      if (gesture.current.mode !== "pan") return;
      const active = gesture.current;
      const dx = clientX - active.startX;
      const dy = clientY - active.startY;
      setTransform((t) => ({
        ...t,
        x: active.startPanX + dx,
        y: active.startPanY + dy,
      }));
    }

    function endGesture() {
      gesture.current.mode = "none";
      gesture.current.pointerId = -1;
      setIsPanning(false);
      if (!panAtBaseScale) {
        setTransform((t) => {
          if (t.scale <= 1.02) return { scale: 1, x: 0, y: 0 };
          return t;
        });
      }
    }

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
          pointerId: -1,
        };
        setIsPanning(true);
      } else if (e.touches.length === 1 && canPan(transformRef.current.scale)) {
        beginPendingPan(e.touches[0].clientX, e.touches[0].clientY);
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

      if (
        (g.mode === "pan" || g.mode === "pending") &&
        e.touches.length === 1
      ) {
        if (g.mode === "pan" || gesture.current.mode === "pan") {
          e.preventDefault();
        }
        movePan(e.touches[0].clientX, e.touches[0].clientY);
        if (gesture.current.mode === "pan") {
          e.preventDefault();
        }
      }
    }

    function onPointerDown(e: PointerEvent) {
      if (!el) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (e.pointerType === "touch") return;
      if (!canPan(transformRef.current.scale)) return;
      beginPendingPan(e.clientX, e.clientY, e.pointerId);
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }

    function onPointerMove(e: PointerEvent) {
      const g = gesture.current;
      if (
        (g.mode === "pan" || g.mode === "pending") &&
        g.pointerId === e.pointerId
      ) {
        movePan(e.clientX, e.clientY);
        if (gesture.current.mode === "pan") {
          e.preventDefault();
        }
      }
    }

    function onPointerUp(e: PointerEvent) {
      if (
        gesture.current.pointerId === e.pointerId ||
        gesture.current.mode === "pinch"
      ) {
        endGesture();
        if (!el) return;
        try {
          el.releasePointerCapture(e.pointerId);
        } catch {
          // ignore
        }
      }
    }

    el.addEventListener("touchstart", onTouchStart, { passive: true, capture: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false, capture: true });
    el.addEventListener("touchend", endGesture, { capture: true });
    el.addEventListener("touchcancel", endGesture, { capture: true });
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);

    return () => {
      el.removeEventListener("touchstart", onTouchStart, { capture: true });
      el.removeEventListener("touchmove", onTouchMove, { capture: true });
      el.removeEventListener("touchend", endGesture, { capture: true });
      el.removeEventListener("touchcancel", endGesture, { capture: true });
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
    };
  }, [enabled, reset, canPan, panAtBaseScale]);

  const isExploring =
    transform.scale > 1.02 ||
    Math.abs(transform.x) > 2 ||
    Math.abs(transform.y) > 2;

  return {
    containerRef,
    transform,
    reset,
    zoomIn,
    zoomOut,
    isZoomed: isExploring,
    isPanning,
  };
}
