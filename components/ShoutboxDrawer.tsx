"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const FALLBACK_POLL_MS = 2000;

export interface ShoutboxMessage {
  id: string;
  content: string;
  authorName: string;
  authorAvatar: string | null;
  timestamp: string;
}

interface ShoutboxDrawerProps {
  open: boolean;
  onClose: () => void;
  reducedMotion?: boolean;
}

function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function ShoutboxDrawer({
  open,
  onClose,
  reducedMotion = false,
}: ShoutboxDrawerProps) {
  const [messages, setMessages] = useState<ShoutboxMessage[]>([]);
  const [unlocked, setUnlocked] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [postUsername, setPostUsername] = useState("cooldude67");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const fallbackPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
  }, [reducedMotion]);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/shoutbox/status");
      if (!response.ok) return;
      const data = (await response.json()) as {
        unlocked: boolean;
        configured: boolean;
        username: string;
      };
      setUnlocked(data.unlocked);
      setConfigured(data.configured);
      setPostUsername(data.username);
    } catch {
      // ignore
    }
  }, []);

  const applyMessages = useCallback((nextMessages: ShoutboxMessage[]) => {
    setMessages(nextMessages);
    setError(null);
    setLoading(false);
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetch("/api/shoutbox/messages");
      if (response.status === 503) {
        setConfigured(false);
        setMessages([]);
        return;
      }
      if (!response.ok) {
        let detail: string | undefined;
        try {
          const body = (await response.json()) as { detail?: string };
          detail = body.detail;
        } catch {
          // ignore
        }
        setError(
          process.env.NODE_ENV === "development" && detail
            ? `Could not load messages (${detail})`
            : "Could not load messages"
        );
        return;
      }
      const data = (await response.json()) as { messages: ShoutboxMessage[] };
      applyMessages(data.messages);
    } catch {
      setError("Could not load messages");
      setLoading(false);
    }
  }, [applyMessages]);

  const stopFallbackPolling = useCallback(() => {
    if (fallbackPollRef.current) {
      clearInterval(fallbackPollRef.current);
      fallbackPollRef.current = null;
    }
  }, []);

  const startFallbackPolling = useCallback(() => {
    if (fallbackPollRef.current) return;
    fallbackPollRef.current = setInterval(() => {
      void fetchMessages();
    }, FALLBACK_POLL_MS);
  }, [fetchMessages]);

  const connectLiveStream = useCallback(() => {
    if (eventSourceRef.current) return;

    const source = new EventSource("/api/shoutbox/stream");
    eventSourceRef.current = source;

    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as {
          messages: ShoutboxMessage[];
          live?: boolean;
        };
        applyMessages(data.messages);
        setLive(Boolean(data.live));
        stopFallbackPolling();
      } catch {
        // ignore malformed events
      }
    };

    source.onerror = () => {
      setLive(false);
      source.close();
      eventSourceRef.current = null;
      startFallbackPolling();
    };
  }, [applyMessages, startFallbackPolling, stopFallbackPolling]);

  const disconnectLiveStream = useCallback(() => {
    stopFallbackPolling();
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setLive(false);
  }, [stopFallbackPolling]);

  useEffect(() => {
    if (!open) {
      disconnectLiveStream();
      return;
    }

    setLoading(true);
    fetchStatus();
    connectLiveStream();

    return () => {
      disconnectLiveStream();
    };
  }, [open, fetchStatus, connectLiveStream, disconnectLiveStream]);

  useEffect(() => {
    if (open) scrollToBottom();
  }, [open, messages, scrollToBottom]);

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    setUnlockError(null);
    setUnlocking(true);

    try {
      const response = await fetch("/api/shoutbox/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        setUnlockError(data.error ?? "Invalid password");
        return;
      }

      setUnlocked(true);
      setPassword("");
    } catch {
      setUnlockError("Something went wrong");
    } finally {
      setUnlocking(false);
    }
  }

  async function handleLock() {
    try {
      await fetch("/api/shoutbox/lock", { method: "POST" });
      setUnlocked(false);
      setDraft("");
      setSendError(null);
    } catch {
      // ignore
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const content = draft.trim();
    if (!content) return;

    setSendError(null);
    setSending(true);

    try {
      const response = await fetch("/api/shoutbox/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        setSendError(data.error ?? "Failed to send");
        return;
      }

      setDraft("");
    } catch {
      setSendError("Failed to send");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <div
        className={`shoutbox-backdrop${open ? " shoutbox-backdrop--open" : ""}`}
        onClick={onClose}
        aria-hidden={!open}
      />
      <aside
        className={`shoutbox-drawer${open ? " shoutbox-drawer--open" : ""}${reducedMotion ? " shoutbox-drawer--no-motion" : ""}`}
        aria-hidden={!open}
        aria-label="Live chat"
      >
        <header className="shoutbox-header">
          <div className="shoutbox-header-title">
            <h2 className="shoutbox-title">Live Chat</h2>
            {live && configured && (
              <span className="shoutbox-live-badge" aria-label="Live updates">
                Live
              </span>
            )}
          </div>
          <button
            type="button"
            className="shoutbox-close"
            onClick={onClose}
            aria-label="Close chat"
          >
            <CloseIcon />
          </button>
        </header>

        <div className="shoutbox-messages" ref={messagesContainerRef}>
          {!configured ? (
            <p className="shoutbox-empty">Chat is not available right now.</p>
          ) : loading && messages.length === 0 ? (
            <p className="shoutbox-empty">Loading messages…</p>
          ) : error ? (
            <p className="shoutbox-error">{error}</p>
          ) : messages.length === 0 ? (
            <p className="shoutbox-empty">No messages yet.</p>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="shoutbox-message">
                {message.authorAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={message.authorAvatar}
                    alt=""
                    className="shoutbox-message-avatar"
                    width={32}
                    height={32}
                  />
                ) : (
                  <div className="shoutbox-message-avatar shoutbox-message-avatar--placeholder" />
                )}
                <div className="shoutbox-message-body">
                  <div className="shoutbox-message-meta">
                    <span className="shoutbox-message-author">
                      {message.authorName}
                    </span>
                    <time
                      className="shoutbox-message-time"
                      dateTime={message.timestamp}
                    >
                      {formatRelativeTime(message.timestamp)}
                    </time>
                  </div>
                  <p className="shoutbox-message-content">{message.content}</p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <footer className="shoutbox-footer">
          {unlocked ? (
            <>
              <div className="shoutbox-compose-header">
                <span className="shoutbox-compose-label">Posting as {postUsername}</span>
                <button
                  type="button"
                  className="shoutbox-lock-btn"
                  onClick={handleLock}
                  aria-label="Lock chat"
                  title="Lock chat"
                >
                  <LockIcon />
                </button>
              </div>
              <form className="shoutbox-compose" onSubmit={handleSend}>
                <input
                  type="text"
                  className="shoutbox-input"
                  placeholder="Type a message…"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  maxLength={500}
                  disabled={sending}
                  aria-label="Message"
                />
                <button
                  type="submit"
                  className="btn btn-primary shoutbox-send-btn"
                  disabled={sending || !draft.trim()}
                >
                  Send
                </button>
              </form>
              {sendError && <p className="shoutbox-error">{sendError}</p>}
            </>
          ) : configured ? (
            <form className="shoutbox-unlock" onSubmit={handleUnlock}>
              <p className="shoutbox-unlock-hint">
                Only one very cool person needs to chat this way, and he knows the
                code :)
              </p>
              <input
                type="password"
                className="shoutbox-input"
                placeholder="Enter the code"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={unlocking}
                aria-label="Unlock password"
              />
              <button
                type="submit"
                className="btn btn-ghost shoutbox-unlock-btn"
                disabled={unlocking || !password.trim()}
              >
                {unlocking ? "Unlocking…" : "Unlock"}
              </button>
              {unlockError && <p className="shoutbox-error">{unlockError}</p>}
            </form>
          ) : null}
        </footer>
      </aside>
    </>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M18 6L6 18M6 6l12 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="5"
        y="11"
        width="14"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M8 11V8a4 4 0 0 1 8 0v3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
