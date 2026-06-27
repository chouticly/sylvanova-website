"use client";

import type { AnnouncementTextPart } from "@/lib/announcement-model";

function roleMentionStyle(color: string | null): React.CSSProperties {
  if (!color) {
    return {
      background: "rgba(88, 101, 242, 0.35)",
      color: "#dee0fc",
    };
  }

  const hex = color.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  return {
    background: `rgba(${r}, ${g}, ${b}, 0.3)`,
    color,
  };
}

interface AnnouncementFormattedTextProps {
  parts: AnnouncementTextPart[];
  className?: string;
}

export function AnnouncementFormattedText({
  parts,
  className,
}: AnnouncementFormattedTextProps) {
  if (parts.length === 0) return null;

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.type === "everyone") {
          return (
            <span
              key={`${index}-${part.value}`}
              className="announcement-mention"
            >
              {part.value}
            </span>
          );
        }

        if (part.type === "role") {
          return (
            <span
              key={`${index}-${part.value}`}
              className="announcement-role-mention"
              style={roleMentionStyle(part.color)}
            >
              {part.value}
            </span>
          );
        }

        if (part.type === "channel") {
          return (
            <a
              key={`${index}-${part.value}`}
              href={part.url}
              className="announcement-channel-mention"
              target="_blank"
              rel="noopener noreferrer"
            >
              {part.value}
            </a>
          );
        }

        return <span key={index}>{part.value}</span>;
      })}
    </span>
  );
}

export function partsHaveContent(parts: AnnouncementTextPart[]): boolean {
  return parts.some((part) => part.value.trim().length > 0);
}
