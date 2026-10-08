"use client";

import { useCallback, useEffect, useState } from "react";

// A custom hook that owns the camera's whole lifecycle:
// turn on -> ask permission -> hold a stream; turn off or unmount -> release it.
export function useCamera(startOn: boolean) {
  const [enabled, setEnabled] = useState(startOn);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // mediaDevices only exists on secure origins (https:// or localhost).
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera isn't available here (it needs HTTPS).");
      setEnabled(false);
      return;
    }

    let cancelled = false; // set by cleanup, so a late permission result is ignored
    let active: MediaStream | null = null;

    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop()); // we no longer want it
          return;
        }
        active = s;
        setStream(s);
        setError(null);
      })
      .catch(() => {
        if (cancelled) return;
        setError("Couldn't access your camera. Check your browser permissions.");
        setEnabled(false);
      });

    // Runs when the camera is switched off OR the component unmounts.
    return () => {
      cancelled = true;
      active?.getTracks().forEach((t) => t.stop()); // turns the camera light off
      setStream(null);
    };
  }, [enabled]);

  const toggle = useCallback(() => setEnabled((on) => !on), []);

  return { enabled, stream, error, toggle };
}