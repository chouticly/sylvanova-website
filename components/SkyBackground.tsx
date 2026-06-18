"use client";

import { useEffect, useState } from "react";
import type { TimeOfDay } from "@/lib/constants";
import { getSkyPalette } from "@/lib/colors";

interface SkyBackgroundProps {
  timeOfDay: TimeOfDay;
}

export function SkyBackground({ timeOfDay }: SkyBackgroundProps) {
  const sky = getSkyPalette(timeOfDay);
  const [stars, setStars] = useState<{ x: number; y: number; size: number; opacity: number }[]>(
    []
  );

  useEffect(() => {
    const generated = Array.from({ length: 60 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 55,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.6 + 0.2,
    }));
    setStars(generated);
  }, []);

  const showStars = timeOfDay === "night" || timeOfDay === "dawn";

  return (
    <div
      className="sky-background"
      style={{
        background: `linear-gradient(180deg, ${sky.top} 0%, ${sky.mid} 45%, ${sky.bottom} 100%)`,
      }}
      aria-hidden
    >
      <div
        className="sky-glow"
        style={{
          background: `radial-gradient(ellipse at 50% 80%, ${sky.glow} 0%, transparent 70%)`,
        }}
      />
      {showStars &&
        stars.map((star, i) => (
          <div
            key={i}
            className="sky-star"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
              opacity: star.opacity,
            }}
          />
        ))}
    </div>
  );
}
