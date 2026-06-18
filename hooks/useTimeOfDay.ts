"use client";

import { useEffect, useState } from "react";
import type { TimeOfDay } from "@/lib/constants";

function getTimeOfDay(date: Date = new Date()): TimeOfDay {
  const hour = date.getHours();
  if (hour >= 5 && hour < 8) return "dawn";
  if (hour >= 8 && hour < 18) return "day";
  if (hour >= 18 && hour < 21) return "dusk";
  return "night";
}

export function useTimeOfDay(): TimeOfDay {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("day");

  useEffect(() => {
    const update = () => setTimeOfDay(getTimeOfDay());
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);

  return timeOfDay;
}

export { getTimeOfDay };
