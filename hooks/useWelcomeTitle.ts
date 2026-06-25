"use client";

import { useLayoutEffect } from "react";
import { getWelcomeTitle, VISIT_MARKER } from "@/lib/welcome-title";

function hasVisitedBefore(): boolean {
  return (
    localStorage.getItem(VISIT_MARKER) === "1" ||
    document.cookie.includes(`${VISIT_MARKER}=1`)
  );
}

function markVisited(): void {
  localStorage.setItem(VISIT_MARKER, "1");
  document.cookie = `${VISIT_MARKER}=1; path=/; max-age=31536000; SameSite=Lax`;
}

export function useWelcomeTitle() {
  useLayoutEffect(() => {
    const hasVisited = hasVisitedBefore();
    document.title = getWelcomeTitle(hasVisited);

    if (!hasVisited) {
      markVisited();
    } else if (localStorage.getItem(VISIT_MARKER) !== "1") {
      localStorage.setItem(VISIT_MARKER, "1");
    }
  }, []);
}
