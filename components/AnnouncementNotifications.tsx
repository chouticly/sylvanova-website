"use client";

import { useCallback, useMemo, useReducer, useRef, useState } from "react";
import { AnnouncementFormattedText, partsHaveContent } from "@/components/AnnouncementFormattedText";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { useAnnouncementBodyScroll } from "@/hooks/useAnnouncementBodyScroll";
import { useAnnouncementRotation } from "@/hooks/useAnnouncementRotation";
import {
  announcementHasBody,
  type Announcement,
  type AnnouncementEmbed,
} from "@/lib/announcement-model";

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function EmbedBlock({ embed }: { embed: AnnouncementEmbed }) {
  const content = (
    <>
      {embed.titleParts && partsHaveContent(embed.titleParts) && (
        <p className="announcement-embed-title">
          <AnnouncementFormattedText parts={embed.titleParts} />
        </p>
      )}
      {embed.descriptionParts && partsHaveContent(embed.descriptionParts) && (
        <p className="announcement-embed-desc">
          <AnnouncementFormattedText parts={embed.descriptionParts} />
        </p>
      )}
      {embed.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={embed.imageUrl}
          alt=""
          className="announcement-embed-image"
        />
      )}
    </>
  );

  if (embed.url) {
    return (
      <a
        href={embed.url}
        className="announcement-embed"
        target="_blank"
        rel="noopener noreferrer"
      >
        {content}
      </a>
    );
  }

  return <div className="announcement-embed">{content}</div>;
}

function CollapseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M15 6l-6 6 6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ExpandIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AnnouncementCard({
  announcement,
  reducedMotion,
  paused,
  userControlled,
  onUserControl,
  onAutoFinished,
  onHoverChange,
  onCollapse,
}: {
  announcement: Announcement;
  reducedMotion: boolean;
  paused: boolean;
  userControlled: boolean;
  onUserControl: () => void;
  onAutoFinished: () => void;
  onHoverChange: (hovering: boolean) => void;
  onCollapse: () => void;
}) {
  const bodyRef = useAnnouncementBodyScroll({
    announcementId: announcement.id,
    reducedMotion,
    paused,
    userControlled,
    onUserControl,
    onFinished: onAutoFinished,
  });
  const accentColor = announcement.author.roleColor ?? "var(--color-accent)";
  const hasBody = announcementHasBody(announcement);

  return (
    <article
      className={`announcement-card${reducedMotion ? " announcement-card--static" : ""}${paused ? " announcement-card--paused" : ""}`}
      aria-label={`Announcement from ${announcement.author.nickname}`}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
    >
      <div className="announcement-card-header">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={announcement.author.avatarUrl}
          alt=""
          className="announcement-avatar"
          style={{ borderColor: accentColor }}
          width={40}
          height={40}
        />
        <div className="announcement-meta">
          <div className="announcement-meta-top">
            <span
              className="announcement-author"
              style={{ color: accentColor }}
            >
              {announcement.author.nickname}
            </span>
            {announcement.mentionEveryone && (
              <span className="announcement-badge">Server Announcement</span>
            )}
          </div>
          <time
            className="announcement-time"
            dateTime={announcement.createdAt}
          >
            {formatRelativeTime(announcement.createdAt)}
          </time>
        </div>
        <button
          type="button"
          className="announcement-collapse-btn"
          onClick={onCollapse}
          aria-label="Hide announcements"
        >
          <CollapseIcon />
        </button>
      </div>

      {hasBody && (
        <div className="announcement-body" ref={bodyRef}>
          {partsHaveContent(announcement.contentParts) && (
            <p className="announcement-content">
              <AnnouncementFormattedText parts={announcement.contentParts} />
            </p>
          )}
          {announcement.embeds.map((embed, i) => (
            <EmbedBlock key={`${announcement.id}-embed-${i}`} embed={embed} />
          ))}
        </div>
      )}

      <footer className="announcement-footer">
        <a
          href={announcement.discordUrl}
          className="announcement-discord-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          View in Discord
        </a>
      </footer>
    </article>
  );
}

export function AnnouncementNotifications() {
  const { announcements, loading } = useAnnouncements();
  const {
    activeAnnouncement,
    activeIndex,
    queueLength,
    reducedMotion,
    goToNext,
    goToPrevious,
  } = useAnnouncementRotation(announcements);
  const [interrupted, setInterrupted] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const [seenVersion, bumpSeen] = useReducer((count: number) => count + 1, 0);

  const markSeen = useCallback((id: string | undefined) => {
    if (!id || seenIdsRef.current.has(id)) return;
    seenIdsRef.current.add(id);
    bumpSeen();
  }, []);

  const unreadCount = useMemo(
    () => announcements.filter((a) => !seenIdsRef.current.has(a.id)).length,
    [announcements, seenVersion]
  );

  const markInterrupted = useCallback(() => {
    setInterrupted(true);
  }, []);

  const handleHoverChange = useCallback((isHovering: boolean) => {
    setHovering(isHovering);
    if (isHovering) {
      setInterrupted(true);
    }
  }, []);

  const handleManualNav = useCallback(
    (direction: "prev" | "next") => {
      markSeen(activeAnnouncement?.id);
      if (direction === "prev") {
        goToPrevious();
      } else {
        goToNext();
      }
    },
    [activeAnnouncement?.id, goToNext, goToPrevious, markSeen]
  );

  const handleAutoFinished = useCallback(() => {
    markSeen(activeAnnouncement?.id);
    goToNext();
  }, [activeAnnouncement?.id, goToNext, markSeen]);

  const showNav = interrupted && queueLength > 1;

  const handleCollapse = useCallback(() => {
    setCollapsed(true);
    setInterrupted(true);
  }, []);

  const handleExpand = useCallback(() => {
    setCollapsed(false);
  }, []);

  if (loading && announcements.length === 0) return null;
  if (!activeAnnouncement) return null;

  if (collapsed) {
    const expandLabel =
      unreadCount > 0
        ? `Show announcements, ${unreadCount} unread`
        : "Show announcements";

    return (
      <div className="announcement-notifications announcement-notifications--collapsed">
        <button
          type="button"
          className="announcement-expand-btn"
          onClick={handleExpand}
          aria-label={expandLabel}
        >
          <ExpandIcon />
          {unreadCount > 0 && (
            <span className="announcement-unread-badge" aria-hidden="true">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div
      className="announcement-notifications"
      aria-live="polite"
      aria-atomic="true"
    >
      <AnnouncementCard
        key={activeAnnouncement.id}
        announcement={activeAnnouncement}
        reducedMotion={reducedMotion}
        paused={interrupted || hovering}
        userControlled={interrupted}
        onUserControl={markInterrupted}
        onAutoFinished={handleAutoFinished}
        onHoverChange={handleHoverChange}
        onCollapse={handleCollapse}
      />
      {showNav ? (
        <div className="announcement-nav">
          <button
            type="button"
            className="announcement-nav-btn"
            onClick={() => handleManualNav("prev")}
            aria-label="Previous announcement"
          >
            Previous
          </button>
          <span className="announcement-nav-count">
            {activeIndex + 1} / {queueLength}
          </span>
          <button
            type="button"
            className="announcement-nav-btn"
            onClick={() => handleManualNav("next")}
            aria-label="Next announcement"
          >
            Next
          </button>
        </div>
      ) : (
        queueLength > 1 && (
          <div className="announcement-dots" aria-hidden="true">
            {Array.from({ length: Math.min(queueLength, 8) }).map((_, i) => (
              <span
                key={i}
                className={`announcement-dot${i === activeIndex % Math.min(queueLength, 8) ? " announcement-dot--active" : ""}`}
              />
            ))}
          </div>
        )
      )}
    </div>
  );
}
