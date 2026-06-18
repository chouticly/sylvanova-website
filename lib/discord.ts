import type { SessionUser } from "./session";

const DISCORD_API = "https://discord.com/api/v10";

export function getDiscordAuthUrl(state: string): string {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const redirectUri = process.env.DISCORD_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    throw new Error("Discord OAuth is not configured");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "identify",
    state,
  });

  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string): Promise<string> {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const redirectUri = process.env.DISCORD_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Discord OAuth is not configured");
  }

  const response = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token exchange failed: ${text}`);
  }

  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

export async function fetchDiscordUser(accessToken: string): Promise<SessionUser> {
  const response = await fetch(`${DISCORD_API}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch Discord user");
  }

  const data = (await response.json()) as {
    id: string;
    username: string;
    global_name: string | null;
    avatar: string | null;
    discriminator: string;
  };

  return {
    id: data.id,
    username: data.username,
    globalName: data.global_name,
    avatar: data.avatar,
    discriminator: data.discriminator,
  };
}

export function generateOAuthState(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
