"use client";

import { useEffect, useRef } from "react";
import type { Season } from "@/lib/constants";

interface ParticleFieldProps {
  season: Season;
  reducedMotion?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
}

function getParticleConfig(season: Season, isMobile: boolean) {
  const count = isMobile ? 20 : 40;
  switch (season) {
    case "fall":
      return { count, type: "leaf" as const, color: "#e8a838" };
    case "winter":
      return { count, type: "snow" as const, color: "#ffffff" };
    case "spring":
      return { count: Math.floor(count * 0.7), type: "pollen" as const, color: "#c8e8a0" };
    default:
      return { count: Math.floor(count * 0.5), type: "firefly" as const, color: "#a8e878" };
  }
}

export function ParticleField({ season, reducedMotion = false }: ParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef<number>(0);

  useEffect(() => {
    if (reducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const isMobile = window.innerWidth < 768;
    const config = getParticleConfig(season, isMobile);

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    particlesRef.current = Array.from({ length: config.count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * (config.type === "snow" ? 0.3 : 0.8),
      vy:
        config.type === "snow"
          ? Math.random() * 1.2 + 0.5
          : config.type === "leaf"
            ? Math.random() * 1.5 + 0.8
            : (Math.random() - 0.5) * 0.5,
      size: Math.random() * 4 + 2,
      opacity: Math.random() * 0.5 + 0.3,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.05,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        if (p.y > canvas.height + 10) {
          p.y = -10;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        if (config.type === "leaf") {
          ctx.fillStyle = config.color;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size, p.size * 0.6, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (config.type === "snow") {
          ctx.fillStyle = config.color;
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (config.type === "firefly") {
          ctx.fillStyle = config.color;
          ctx.shadowColor = config.color;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        } else {
          ctx.fillStyle = config.color;
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.3, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    const timeout = setTimeout(() => {
      animRef.current = requestAnimationFrame(draw);
    }, 100);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [season, reducedMotion]);

  if (reducedMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      className="particle-field"
      aria-hidden
    />
  );
}
