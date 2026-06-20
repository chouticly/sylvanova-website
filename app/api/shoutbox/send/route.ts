import { NextResponse } from "next/server";
import {
  isShoutboxConfigured,
  postShoutboxMessage,
  sanitizeMessageContent,
} from "@/lib/shoutbox";
import { getSession } from "@/lib/session-server";
import { isShoutboxUnlocked } from "@/lib/session";

const SEND_COOLDOWN_MS = 3000;

export async function POST(request: Request) {
  if (!isShoutboxConfigured()) {
    return NextResponse.json(
      { error: "Shoutbox is not configured" },
      { status: 503 }
    );
  }

  const session = await getSession();
  if (!isShoutboxUnlocked(session)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  let body: { content?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const content = sanitizeMessageContent(body.content ?? "");
  if (!content) {
    return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
  }

  const now = Date.now();
  if (
    session.shoutboxLastSendAt &&
    now - session.shoutboxLastSendAt < SEND_COOLDOWN_MS
  ) {
    return NextResponse.json(
      { error: "Please wait before sending another message" },
      { status: 429 }
    );
  }

  try {
    await postShoutboxMessage(content);
    session.shoutboxLastSendAt = now;
    await session.save();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 502 }
    );
  }
}
