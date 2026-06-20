"use client";

import { useState } from "react";
import { ShoutboxDrawer } from "./ShoutboxDrawer";

interface ShoutboxTriggerProps {
  reducedMotion?: boolean;
}

export function ShoutboxTrigger({ reducedMotion = false }: ShoutboxTriggerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="shoutbox-trigger"
        onClick={() => setOpen(true)}
        aria-label="Open live chat"
        aria-expanded={open}
      >
        <ChatIcon />
      </button>
      <ShoutboxDrawer
        open={open}
        onClose={() => setOpen(false)}
        reducedMotion={reducedMotion}
      />
    </>
  );
}

function ChatIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
