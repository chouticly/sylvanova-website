"use client";

import { useLayoutEffect } from "react";
import { PAGE_TITLE, syncVisitMarker } from "@/lib/welcome-title";

export function useWelcomeTitle() {
  useLayoutEffect(() => {
    syncVisitMarker();
    document.title = PAGE_TITLE;
  }, []);
}
