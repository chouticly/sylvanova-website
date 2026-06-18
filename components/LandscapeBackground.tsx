"use client";

import { useEffect, useState } from "react";
import type { SeasonPalette } from "@/lib/colors";

interface LandscapeBackgroundProps {
  palette: SeasonPalette;
}

export function LandscapeBackground({ palette }: LandscapeBackgroundProps) {
  const { x, y } = useParallax();

  return (
    <div className="landscape-background" aria-hidden>
      <svg
        viewBox="0 0 1200 520"
        preserveAspectRatio="xMidYMax slice"
        className="landscape-background-svg"
      >
        <g
          style={{
            transform: `translate(${x * 4}px, ${y * 2}px)`,
          }}
        >
          <path
            d="M0,380 L200,280 L400,340 L600,220 L800,300 L1000,250 L1200,320 L1200,520 L0,520 Z"
            fill={palette.ground}
            opacity={0.4}
          />
        </g>
        <g
          style={{
            transform: `translate(${x * 8}px, ${y * 4}px)`,
          }}
        >
          <path
            d="M0,420 L300,350 L500,380 L700,310 L900,360 L1200,340 L1200,520 L0,520 Z"
            fill={palette.ground}
            opacity={0.6}
          />
        </g>
        <rect x={0} y={460} width={1200} height={60} fill={palette.ground} />
        <ellipse cx={600} cy={470} rx={700} ry={40} fill={palette.mist} />
        <ellipse cx={200} cy={475} rx={80} ry={15} fill={palette.leaf} opacity={0.3} />
        <ellipse cx={600} cy={478} rx={120} ry={18} fill={palette.leafAccent} opacity={0.25} />
        <ellipse cx={950} cy={476} rx={90} ry={14} fill={palette.leaf} opacity={0.3} />
      </svg>
    </div>
  );
}

function useParallax() {
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reducedMotion) return;

    const isMobile = window.innerWidth < 768;

    if (isMobile) {
      let drift = 0;
      const id = setInterval(() => {
        drift += 0.02;
        setOffset({
          x: Math.sin(drift) * 0.3,
          y: Math.cos(drift * 0.7) * 0.2,
        });
      }, 50);
      return () => clearInterval(id);
    }

    const onMove = (e: MouseEvent) => {
      setOffset({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return offset;
}
