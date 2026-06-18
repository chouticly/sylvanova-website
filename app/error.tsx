"use client";

import { useEffect } from "react";
import { getThemePalette } from "@/lib/colors";

const themePalette = getThemePalette();

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      className="landing-scene landing-scene--loading"
      style={
        {
          "--color-text": themePalette.text,
          "--color-text-muted": themePalette.textMuted,
          "--color-accent": themePalette.accent,
          "--color-accent-glow": themePalette.accentGlow,
          "--color-surface": themePalette.surface,
          "--color-border": themePalette.border,
        } as React.CSSProperties
      }
    >
      <main className="hero">
        <h1 className="hero-wordmark">
          <span className="hero-wordmark-sylva">Sylva</span>
          <span className="hero-wordmark-nova">Nova</span>
        </h1>
        <p className="hero-description">
          Something went wrong loading the grove.
        </p>
        <button type="button" className="btn btn-primary" onClick={reset}>
          Try again
        </button>
      </main>
    </div>
  );
}
