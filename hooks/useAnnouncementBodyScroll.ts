"use client";

import { useEffect, useRef } from "react";
import {
  ANNOUNCEMENT_REDUCED_MOTION_DURATION_MS,
  ANNOUNCEMENT_SCROLL_END_PAUSE_MS,
  ANNOUNCEMENT_SCROLL_PX_PER_SEC,
  ANNOUNCEMENT_SCROLL_START_DELAY_MS,
} from "@/lib/constants";

interface ScrollSignal {
  cancelled: boolean;
  rafId: number;
  timeouts: ReturnType<typeof setTimeout>[];
}

function waitWhilePaused(
  isPaused: () => boolean,
  signal: ScrollSignal
): Promise<void> {
  return new Promise((resolve) => {
    const tick = () => {
      if (signal.cancelled) {
        resolve();
        return;
      }
      if (isPaused()) {
        signal.rafId = requestAnimationFrame(tick);
        return;
      }
      resolve();
    };
    tick();
  });
}

async function delay(
  ms: number,
  signal: ScrollSignal,
  isPaused: () => boolean
): Promise<void> {
  const start = performance.now();
  while (performance.now() - start < ms) {
    if (signal.cancelled) return;
    if (isPaused()) {
      await waitWhilePaused(isPaused, signal);
      if (signal.cancelled) return;
      continue;
    }
    await new Promise<void>((resolve) => {
      const id = setTimeout(resolve, 50);
      signal.timeouts.push(id);
    });
  }
}

async function animateScroll(
  element: HTMLElement,
  maxScroll: number,
  durationMs: number,
  signal: ScrollSignal,
  isPaused: () => boolean,
  isAutoScrolling: { current: boolean }
): Promise<void> {
  const startScroll = element.scrollTop;
  const distance = maxScroll - startScroll;
  if (distance <= 0) return;

  let elapsed = 0;
  let lastFrame = performance.now();

  await new Promise<void>((resolve) => {
    const step = (now: number) => {
      if (signal.cancelled) {
        isAutoScrolling.current = false;
        resolve();
        return;
      }

      if (isPaused()) {
        isAutoScrolling.current = false;
        lastFrame = now;
        waitWhilePaused(isPaused, signal).then(() => {
          if (signal.cancelled) {
            resolve();
            return;
          }
          lastFrame = performance.now();
          isAutoScrolling.current = true;
          signal.rafId = requestAnimationFrame(step);
        });
        return;
      }

      elapsed += now - lastFrame;
      lastFrame = now;
      isAutoScrolling.current = true;

      const progress = Math.min(1, elapsed / durationMs);
      element.scrollTop = startScroll + distance * progress;

      if (progress < 1) {
        signal.rafId = requestAnimationFrame(step);
      } else {
        isAutoScrolling.current = true;
        resolve();
      }
    };

    isAutoScrolling.current = true;
    signal.rafId = requestAnimationFrame(step);
  });
}

interface UseAnnouncementBodyScrollOptions {
  announcementId: string;
  reducedMotion: boolean;
  paused: boolean;
  userControlled: boolean;
  onUserControl: () => void;
  onFinished: () => void;
}

export function useAnnouncementBodyScroll({
  announcementId,
  reducedMotion,
  paused,
  userControlled,
  onUserControl,
  onFinished,
}: UseAnnouncementBodyScrollOptions) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const onFinishedRef = useRef(onFinished);
  const onUserControlRef = useRef(onUserControl);
  const isAutoScrolling = useRef(false);
  const ignoreUserScrollUntil = useRef(0);
  const pausedRef = useRef(paused);
  const userControlledRef = useRef(userControlled);
  const scrollSignalRef = useRef<ScrollSignal | null>(null);

  onFinishedRef.current = onFinished;
  onUserControlRef.current = onUserControl;
  pausedRef.current = paused;
  userControlledRef.current = userControlled;

  const cancelAutoScroll = () => {
    const signal = scrollSignalRef.current;
    if (!signal) return;

    signal.cancelled = true;
    cancelAnimationFrame(signal.rafId);
    signal.timeouts.forEach(clearTimeout);
    scrollSignalRef.current = null;
    isAutoScrolling.current = false;
  };

  const suppressUserScroll = (ms = 300) => {
    ignoreUserScrollUntil.current = performance.now() + ms;
    isAutoScrolling.current = true;
    window.setTimeout(() => {
      if (performance.now() >= ignoreUserScrollUntil.current) {
        isAutoScrolling.current = false;
      }
    }, ms + 50);
  };

  const claimUserControl = () => {
    cancelAutoScroll();
    onUserControlRef.current();
  };

  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;

    const handleUserScroll = () => {
      if (performance.now() < ignoreUserScrollUntil.current) return;
      if (isAutoScrolling.current) return;
      onUserControlRef.current();
    };

    const handleWheel = (event: WheelEvent) => {
      if (performance.now() < ignoreUserScrollUntil.current) return;
      if (isAutoScrolling.current) return;
      if (event.isTrusted) onUserControlRef.current();
    };

    const handleTouchStart = () => {
      claimUserControl();
    };

    body.addEventListener("wheel", handleWheel, { passive: true });
    body.addEventListener("touchstart", handleTouchStart, { passive: true });
    body.addEventListener("scroll", handleUserScroll, { passive: true });

    return () => {
      body.removeEventListener("wheel", handleWheel);
      body.removeEventListener("touchstart", handleTouchStart);
      body.removeEventListener("scroll", handleUserScroll);
    };
  }, [announcementId]);

  useEffect(() => {
    if (userControlled) return;

    const body = bodyRef.current;
    if (!body) return;

    const signal: ScrollSignal = {
      cancelled: false,
      rafId: 0,
      timeouts: [],
    };
    scrollSignalRef.current = signal;

    const isPaused = () =>
      pausedRef.current || userControlledRef.current;

    const run = async () => {
      suppressUserScroll(200);
      body.scrollTop = 0;
      await delay(50, signal, isPaused);
      if (signal.cancelled || userControlledRef.current) return;

      const maxScroll = body.scrollHeight - body.clientHeight;

      if (reducedMotion) {
        await delay(ANNOUNCEMENT_REDUCED_MOTION_DURATION_MS, signal, isPaused);
        if (signal.cancelled || userControlledRef.current) return;
        await delay(ANNOUNCEMENT_SCROLL_END_PAUSE_MS, signal, isPaused);
        if (signal.cancelled || userControlledRef.current) return;
        onFinishedRef.current();
        return;
      }

      if (maxScroll <= 4) {
        await delay(ANNOUNCEMENT_SCROLL_START_DELAY_MS, signal, isPaused);
        if (signal.cancelled || userControlledRef.current) return;
        await delay(ANNOUNCEMENT_SCROLL_END_PAUSE_MS, signal, isPaused);
        if (signal.cancelled || userControlledRef.current) return;
        onFinishedRef.current();
        return;
      }

      await delay(ANNOUNCEMENT_SCROLL_START_DELAY_MS, signal, isPaused);
      if (signal.cancelled || userControlledRef.current) return;

      const durationMs = (maxScroll / ANNOUNCEMENT_SCROLL_PX_PER_SEC) * 1000;
      await animateScroll(body, maxScroll, durationMs, signal, isPaused, isAutoScrolling);
      suppressUserScroll(400);
      if (signal.cancelled || userControlledRef.current) return;

      await delay(ANNOUNCEMENT_SCROLL_END_PAUSE_MS, signal, isPaused);
      if (signal.cancelled || userControlledRef.current) return;

      onFinishedRef.current();
    };

    run();

    return () => {
      signal.cancelled = true;
      isAutoScrolling.current = false;
      cancelAnimationFrame(signal.rafId);
      signal.timeouts.forEach(clearTimeout);
      if (scrollSignalRef.current === signal) {
        scrollSignalRef.current = null;
      }
    };
  }, [announcementId, reducedMotion, userControlled]);

  return bodyRef;
}
