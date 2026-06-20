import { NextResponse } from "next/server";
import { getSession } from "@/lib/session-server";

export async function POST() {
  const session = await getSession();
  session.shoutboxUnlocked = false;
  session.shoutboxUnlockedAt = undefined;
  session.shoutboxLastSendAt = undefined;
  await session.save();

  return NextResponse.json({ unlocked: false });
}
