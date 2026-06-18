import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken, fetchDiscordUser } from "@/lib/discord";
import { getSession } from "@/lib/session-server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL("/?auth_error=denied", request.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/?auth_error=invalid", request.url));
  }

  const session = await getSession();

  if (!session.oauthState || session.oauthState !== state) {
    return NextResponse.redirect(new URL("/?auth_error=state", request.url));
  }

  try {
    const accessToken = await exchangeCodeForToken(code);
    const user = await fetchDiscordUser(accessToken);
    session.user = user;
    delete session.oauthState;
    await session.save();

    return NextResponse.redirect(new URL("/", request.url));
  } catch {
    return NextResponse.redirect(new URL("/?auth_error=failed", request.url));
  }
}
