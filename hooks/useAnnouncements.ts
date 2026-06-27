"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ANNOUNCEMENT_POLL_INTERVAL_MS,
} from "@/lib/constants";
import type { Announcement } from "@/lib/announcement-model";

interface AnnouncementsResponse {
  announcements: Announcement[];
}

export function useAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const response = await fetch("/api/announcements");
      if (!response.ok) return;
      const data = (await response.json()) as AnnouncementsResponse;
      setAnnouncements(data.announcements ?? []);
    } catch {
      // Keep last known announcements on transient errors.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
    const interval = setInterval(fetchAnnouncements, ANNOUNCEMENT_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchAnnouncements]);

  return { announcements, loading };
}
