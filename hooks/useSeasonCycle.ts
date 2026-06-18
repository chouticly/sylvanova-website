"use client";

import { useEffect, useState } from "react";
import {
  SEASON_CYCLE_MS,
  SEASON_DURATION_MS,
  SEASONS,
  type Season,
} from "@/lib/constants";
import { blendPalettes, getSeasonPalette, type SeasonPalette } from "@/lib/colors";

export interface SeasonState {
  season: Season;
  nextSeason: Season;
  blendT: number;
  palette: SeasonPalette;
  progress: number;
}

function computeSeasonState(elapsed: number, reducedMotion: boolean): SeasonState {
  if (reducedMotion) {
    const palette = getSeasonPalette("summer");
    return {
      season: "summer",
      nextSeason: "summer",
      blendT: 0,
      palette,
      progress: 0,
    };
  }

  const cyclePos = elapsed % SEASON_CYCLE_MS;
  const seasonIndex = Math.floor(cyclePos / SEASON_DURATION_MS);
  const seasonProgress = (cyclePos % SEASON_DURATION_MS) / SEASON_DURATION_MS;
  const season = SEASONS[seasonIndex];
  const nextSeason = SEASONS[(seasonIndex + 1) % SEASONS.length];

  const blendDuration = 0.04;
  const blendT =
    seasonProgress > 1 - blendDuration
      ? (seasonProgress - (1 - blendDuration)) / blendDuration
      : 0;

  const fromPalette = getSeasonPalette(season);
  const toPalette = getSeasonPalette(nextSeason);
  const palette =
    blendT > 0 ? blendPalettes(fromPalette, toPalette, blendT) : fromPalette;

  return {
    season,
    nextSeason,
    blendT,
    palette,
    progress: cyclePos / SEASON_CYCLE_MS,
  };
}

export function useSeasonCycle(active = true): SeasonState {
  const [state, setState] = useState<SeasonState>(() =>
    computeSeasonState(0, false)
  );

  useEffect(() => {
    if (!active) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const start = performance.now();

    const id = window.setInterval(() => {
      setState(computeSeasonState(performance.now() - start, reducedMotion));
    }, 100);

    return () => window.clearInterval(id);
  }, [active]);

  return state;
}
