import { NextResponse } from "next/server";
import { getShoutboxLiveService } from "@/lib/shoutbox-live";
import { fetchChannelMessages, isShoutboxConfigured } from "@/lib/shoutbox";

export async function GET() {
  if (!isShoutboxConfigured()) {
    return NextResponse.json(
      { error: "Shoutbox is not configured" },
      { status: 503 }
    );
  }

  const live = getShoutboxLiveService();
  const cached = live.getMessages();
  if (cached.length > 0) {
    return NextResponse.json({ messages: cached });
  }

  try {
    const messages = await fetchChannelMessages();
    return NextResponse.json({ messages });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch messages";
    if (process.env.NODE_ENV === "development") {
      console.error("[shoutbox] Failed to fetch messages:", message);
    }
    return NextResponse.json(
      {
        error: "Failed to fetch messages",
        ...(process.env.NODE_ENV === "development" && { detail: message }),
      },
      { status: 502 }
    );
  }
}
