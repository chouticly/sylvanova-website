import { NextResponse } from "next/server";
import { getShoutboxUsername, isShoutboxConfigured } from "@/lib/shoutbox";
import { getSession } from "@/lib/session-server";
import { isShoutboxUnlocked } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  return NextResponse.json({
    unlocked: isShoutboxUnlocked(session),
    configured: isShoutboxConfigured(),
    username: getShoutboxUsername(),
  });
}
