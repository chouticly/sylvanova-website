"use client";

import dynamic from "next/dynamic";

import { useWelcomeTitle } from "@/hooks/useWelcomeTitle";

const LandingScene = dynamic(
  () => import("@/components/LandingScene").then((mod) => mod.LandingScene),
  {
    ssr: false,
    loading: () => <div className="landing-scene landing-scene--loading" aria-busy="true" />,
  }
);

export function HomeClient() {
  useWelcomeTitle();

  return <LandingScene />;
}
