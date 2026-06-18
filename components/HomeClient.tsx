"use client";

import dynamic from "next/dynamic";

const LandingScene = dynamic(
  () => import("@/components/LandingScene").then((mod) => mod.LandingScene),
  {
    ssr: false,
    loading: () => <div className="landing-scene landing-scene--loading" aria-busy="true" />,
  }
);

export function HomeClient() {
  return <LandingScene />;
}
