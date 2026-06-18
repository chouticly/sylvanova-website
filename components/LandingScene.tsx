"use client";

import { useEffect, useState } from "react";
import { Hero } from "@/components/Hero";
import { LandscapeBackground } from "@/components/LandscapeBackground";
import { ParticleField } from "@/components/ParticleField";
import { SkyBackground } from "@/components/SkyBackground";
import { useSeasonCycle } from "@/hooks/useSeasonCycle";
import { useTimeOfDay } from "@/hooks/useTimeOfDay";
import { getThemePalette } from "@/lib/colors";

const themePalette = getThemePalette();

export function LandingScene() {
  const timeOfDay = useTimeOfDay();
  const { season, palette } = useSeasonCycle();
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setReducedMotion(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }, []);

  return (
    <div
      className="landing-scene"
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
      <SkyBackground timeOfDay={timeOfDay} />
      <LandscapeBackground palette={palette} />
      <ParticleField season={season} reducedMotion={reducedMotion} />
      <div className="landing-overlay" />
      <Hero />
    </div>
  );
}
