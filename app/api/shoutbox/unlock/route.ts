import { NextResponse } from "next/server";
import { isShoutboxConfigured } from "@/lib/shoutbox";
import { getSession } from "@/lib/session-server";

export async function POST(request: Request) {
  if (!isShoutboxConfigured()) {
    return NextResponse.json(
      { error: "Shoutbox is not configured" },
      { status: 503 }
    );
  }

  const expectedPassword = process.env.SHOUTBOX_POST_PASSWORD;
  if (!expectedPassword) {
    return NextResponse.json(
      { error: "Shoutbox is not configured" },
      { status: 503 }
    );
  }

  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const password = body.password?.trim();
  if (!password || password !== expectedPassword) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const session = await getSession();
  session.shoutboxUnlocked = true;
  session.shoutboxUnlockedAt = Date.now();
  await session.save();

  return NextResponse.json({ unlocked: true });
}
