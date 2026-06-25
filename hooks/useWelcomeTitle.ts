"use client";

import { useEffect } from "react";
import { SITE_NAME } from "@/lib/constants";

const VISIT_STORAGE_KEY = "sylvanova-has-visited";

export function useWelcomeTitle() {
  useEffect(() => {
    const hasVisited = localStorage.getItem(VISIT_STORAGE_KEY) === "1";
    document.title = hasVisited
      ? `${SITE_NAME} — Welcome Back!`
      : `${SITE_NAME} — Welcome Home!`;

    if (!hasVisited) {
      localStorage.setItem(VISIT_STORAGE_KEY, "1");
    }
  }, []);
}
