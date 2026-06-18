import type { Season, TimeOfDay } from "./constants";

export interface SeasonPalette {
  leaf: string;
  leafAccent: string;
  bark: string;
  barkShadow: string;
  ground: string;
  mist: string;
}

export interface SkyPalette {
  top: string;
  mid: string;
  bottom: string;
  glow: string;
}

export interface ThemePalette {
  text: string;
  textMuted: string;
  accent: string;
  accentGlow: string;
  surface: string;
  border: string;
}

const seasonPalettes: Record<Season, SeasonPalette> = {
  spring: {
    leaf: "#7cb87a",
    leafAccent: "#a8d5a2",
    bark: "#e8e4dc",
    barkShadow: "#4a4a4a",
    ground: "#5a7a4a",
    mist: "rgba(168, 213, 162, 0.25)",
  },
  summer: {
    leaf: "#2d6b3f",
    leafAccent: "#4a9e5c",
    bark: "#f0ece4",
    barkShadow: "#3a3a3a",
    ground: "#3d5c32",
    mist: "rgba(74, 158, 92, 0.2)",
  },
  fall: {
    leaf: "#c47a2a",
    leafAccent: "#e8a838",
    bark: "#ddd8ce",
    barkShadow: "#4a4038",
    ground: "#6b4a2a",
    mist: "rgba(232, 168, 56, 0.2)",
  },
  winter: {
    leaf: "#8a9aa8",
    leafAccent: "#b8c8d8",
    bark: "#e0e4e8",
    barkShadow: "#5a6068",
    ground: "#4a5560",
    mist: "rgba(184, 200, 216, 0.3)",
  },
};

const skyByTime: Record<TimeOfDay, SkyPalette> = {
  dawn: {
    top: "#3a4a62",
    mid: "#7a5a52",
    bottom: "#4a5a52",
    glow: "rgba(180, 140, 110, 0.25)",
  },
  day: {
    top: "#1e3a4a",
    mid: "#2d5568",
    bottom: "#3a6a58",
    glow: "rgba(90, 150, 130, 0.2)",
  },
  dusk: {
    top: "#2a2848",
    mid: "#8a4a68",
    bottom: "#d87848",
    glow: "rgba(255, 140, 80, 0.35)",
  },
  night: {
    top: "#0a0e1a",
    mid: "#1a2040",
    bottom: "#2a3050",
    glow: "rgba(100, 120, 200, 0.2)",
  },
};

const darkThemePalette: ThemePalette = {
  text: "#e8f0e8",
  textMuted: "#a8b8a8",
  accent: "#6ab872",
  accentGlow: "rgba(106, 184, 114, 0.4)",
  surface: "rgba(10, 20, 15, 0.7)",
  border: "rgba(106, 184, 114, 0.2)",
};

const brightSkyTextPalette: ThemePalette = {
  text: "#f4faf4",
  textMuted: "#c8d4c8",
  accent: "#7ed487",
  accentGlow: "rgba(126, 212, 135, 0.45)",
  surface: "rgba(8, 16, 12, 0.72)",
  border: "rgba(126, 212, 135, 0.25)",
};

export function getSeasonPalette(season: Season): SeasonPalette {
  return seasonPalettes[season];
}

export function getSkyPalette(time: TimeOfDay): SkyPalette {
  return skyByTime[time];
}

export function getThemePalette(time: TimeOfDay = "night"): ThemePalette {
  return time === "day" || time === "dawn"
    ? brightSkyTextPalette
    : darkThemePalette;
}

function lerpHex(a: string, b: string, t: number): string {
  const parse = (hex: string) => {
    const h = hex.replace("#", "");
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    };
  };
  const ca = parse(a);
  const cb = parse(b);
  const r = Math.round(ca.r + (cb.r - ca.r) * t);
  const g = Math.round(ca.g + (cb.g - ca.g) * t);
  const bl = Math.round(ca.b + (cb.b - ca.b) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

export function blendPalettes(
  from: SeasonPalette,
  to: SeasonPalette,
  t: number
): SeasonPalette {
  return {
    leaf: lerpHex(from.leaf, to.leaf, t),
    leafAccent: lerpHex(from.leafAccent, to.leafAccent, t),
    bark: lerpHex(from.bark, to.bark, t),
    barkShadow: lerpHex(from.barkShadow, to.barkShadow, t),
    ground: lerpHex(from.ground, to.ground, t),
    mist: t < 0.5 ? from.mist : to.mist,
  };
}
