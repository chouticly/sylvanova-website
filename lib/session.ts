import { SessionOptions } from "iron-session";

export interface SessionUser {
  id: string;
  username: string;
  globalName: string | null;
  avatar: string | null;
  discriminator: string;
}

export interface SessionData {
  user?: SessionUser;
  oauthState?: string;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || "complex_password_at_least_32_characters_long",
  cookieName: "sylvanova_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  },
};

export function getAvatarUrl(user: SessionUser): string {
  if (user.avatar) {
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`;
  }
  const defaultIndex = Number(user.discriminator) % 5;
  return `https://cdn.discordapp.com/embed/avatars/${defaultIndex}.png`;
}

export function getDisplayName(user: SessionUser): string {
  return user.globalName || user.username;
}
