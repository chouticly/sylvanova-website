"use client";

import { useEffect, useState } from "react";
import { Hero } from "@/components/Hero";
import { LandscapeBackground } from "@/components/LandscapeBackground";
import { ParticleField } from "@/components/ParticleField";
import { SkyBackground } from "@/components/SkyBackground";
import { useMounted } from "@/hooks/useMounted";
import { useSeasonCycle } from "@/hooks/useSeasonCycle";
import { useTimeOfDay } from "@/hooks/useTimeOfDay";
import { getThemePalette } from "@/lib/colors";

export function LandingScene() {
  const mounted = useMounted();
  const timeOfDay = useTimeOfDay();
  const { season, palette } = useSeasonCycle(mounted);
  const [reducedMotion, setReducedMotion] = useState(false);
  const themePalette = getThemePalette(timeOfDay);

  useEffect(() => {
    setReducedMotion(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }, []);

  if (!mounted) {
    return <div className="landing-scene landing-scene--loading" aria-busy="true" />;
  }

  return (
    <div
      className="landing-scene"
      data-time-of-day={timeOfDay}
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
