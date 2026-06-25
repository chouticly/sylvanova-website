"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Announcement } from "@/lib/announcements";

function buildRotationQueue(announcements: Announcement[]): Announcement[] {
  const everyone = announcements.filter((a) => a.mentionEveryone);
  const normal = announcements.filter((a) => !a.mentionEveryone);
  return [...everyone, ...normal];
}

export function useAnnouncementRotation(announcements: Announcement[]) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const seenEveryoneIds = useRef<Set<string>>(new Set());
  const queue = buildRotationQueue(announcements);

  useEffect(() => {
    setReducedMotion(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }, []);

  useEffect(() => {
    if (queue.length === 0) {
      setActiveIndex(0);
      return;
    }

    const newestEveryone = announcements.find((a) => a.mentionEveryone);
    if (
      newestEveryone &&
      !seenEveryoneIds.current.has(newestEveryone.id)
    ) {
      seenEveryoneIds.current.add(newestEveryone.id);
      const jumpIndex = queue.findIndex((a) => a.id === newestEveryone.id);
      if (jumpIndex >= 0) {
        setActiveIndex(jumpIndex);
      }
    }
  }, [announcements, queue]);

  const goToNext = useCallback(() => {
    if (queue.length <= 1) return;
    setActiveIndex((prev) => (prev + 1) % queue.length);
  }, [queue.length]);

  const goToPrevious = useCallback(() => {
    if (queue.length <= 1) return;
    setActiveIndex((prev) => (prev - 1 + queue.length) % queue.length);
  }, [queue.length]);

  const activeAnnouncement =
    queue.length > 0 ? queue[activeIndex % queue.length] : null;

  return {
    activeAnnouncement,
    activeIndex: queue.length > 0 ? activeIndex % queue.length : 0,
    queueLength: queue.length,
    reducedMotion,
    goToNext,
    goToPrevious,
  };
}
