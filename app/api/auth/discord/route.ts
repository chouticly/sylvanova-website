import { NextResponse } from "next/server";
import { generateOAuthState, getDiscordAuthUrl } from "@/lib/discord";
import { getSession } from "@/lib/session-server";

export async function GET() {
  try {
    const session = await getSession();
    const state = generateOAuthState();
    session.oauthState = state;
    await session.save();

    const url = getDiscordAuthUrl(state);
    return NextResponse.redirect(url);
  } catch {
    return NextResponse.json(
      { error: "Discord OAuth is not configured" },
      { status: 500 }
    );
  }
}
