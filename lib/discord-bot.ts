const DISCORD_API = "https://discord.com/api/v10";

export interface DiscordUser {
  id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
  discriminator: string;
}

export interface DiscordEmbed {
  title?: string;
  description?: string;
  url?: string;
  thumbnail?: { url?: string };
  image?: { url?: string };
}

export interface DiscordMessage {
  id: string;
  content: string;
  timestamp: string;
  mention_everyone: boolean;
  author: DiscordUser;
  embeds: DiscordEmbed[];
}

export interface DiscordRole {
  id: string;
  name: string;
  color: number;
  position: number;
}

export interface DiscordGuildMember {
  nick: string | null;
  avatar: string | null;
  roles: string[];
  user: DiscordUser;
}

interface MemberCacheEntry {
  member: DiscordGuildMember | null;
  expiresAt: number;
}

const memberCache = new Map<string, MemberCacheEntry>();
const MEMBER_CACHE_TTL_MS = 5 * 60 * 1000;

function getBotToken(): string | null {
  return process.env.DISCORD_BOT_TOKEN ?? null;
}

async function botFetch<T>(path: string): Promise<T | null> {
  const token = getBotToken();
  if (!token) return null;

  const response = await fetch(`${DISCORD_API}${path}`, {
    headers: { Authorization: `Bot ${token}` },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as T;
}

export function isDiscordBotConfigured(): boolean {
  return Boolean(
    process.env.DISCORD_BOT_TOKEN &&
      process.env.DISCORD_GUILD_ID &&
      process.env.DISCORD_ANNOUNCEMENT_CHANNEL_ID
  );
}

export async function fetchChannelMessages(
  channelId: string,
  limit: number
): Promise<DiscordMessage[]> {
  const data = await botFetch<DiscordMessage[]>(
    `/channels/${channelId}/messages?limit=${limit}`
  );
  return data ?? [];
}

export interface DiscordGuildChannel {
  id: string;
  name: string;
}

export async function fetchGuildChannels(
  guildId: string
): Promise<DiscordGuildChannel[]> {
  const data = await botFetch<DiscordGuildChannel[]>(`/guilds/${guildId}/channels`);
  return data ?? [];
}

export async function fetchGuildRoles(guildId: string): Promise<DiscordRole[]> {
  const data = await botFetch<DiscordRole[]>(`/guilds/${guildId}/roles`);
  return data ?? [];
}

export async function fetchGuildMember(
  guildId: string,
  userId: string
): Promise<DiscordGuildMember | null> {
  const cacheKey = `${guildId}:${userId}`;
  const cached = memberCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.member;
  }

  const member = await botFetch<DiscordGuildMember>(
    `/guilds/${guildId}/members/${userId}`
  );

  memberCache.set(cacheKey, {
    member,
    expiresAt: Date.now() + MEMBER_CACHE_TTL_MS,
  });

  return member;
}

export function discordColorToHex(color: number): string | null {
  if (!color) return null;
  return `#${color.toString(16).padStart(6, "0")}`;
}

export function resolveRoleColor(
  memberRoleIds: string[],
  roles: DiscordRole[]
): string | null {
  const roleMap = new Map(roles.map((role) => [role.id, role]));
  let best: DiscordRole | null = null;

  for (const roleId of memberRoleIds) {
    const role = roleMap.get(roleId);
    if (!role || !role.color) continue;
    if (!best || role.position > best.position) {
      best = role;
    }
  }

  return best ? discordColorToHex(best.color) : null;
}

export function resolveNickname(
  member: DiscordGuildMember | null,
  author: DiscordUser
): string {
  return member?.nick ?? author.global_name ?? author.username;
}

export function resolveAvatarUrl(
  guildId: string,
  member: DiscordGuildMember | null,
  author: DiscordUser
): string {
  if (member?.avatar) {
    return `https://cdn.discordapp.com/guilds/${guildId}/users/${author.id}/avatars/${member.avatar}.png?size=128`;
  }
  if (author.avatar) {
    return `https://cdn.discordapp.com/avatars/${author.id}/${author.avatar}.png?size=128`;
  }
  const defaultIndex = Number(author.discriminator) % 5;
  return `https://cdn.discordapp.com/embed/avatars/${defaultIndex}.png`;
}

export function hasEveryoneMention(message: DiscordMessage): boolean {
  return message.mention_everyone || /@everyone\b/i.test(message.content);
}

export type AnnouncementTextPart =
  | { type: "text"; value: string }
  | { type: "everyone"; value: string }
  | { type: "role"; value: string; color: string | null }
  | { type: "channel"; value: string; url: string };

const DISCORD_TOKEN_PATTERN =
  /<@&(\d+)>|<@!?(\d+)>|<#(\d+)>|<a?:\w+:\d+>|@everyone\b|@here\b/gi;

function stripMarkdown(text: string): string {
  let result = text;

  result = result.replace(/```(?:\w+)?\n?([\s\S]*?)```/g, "$1");
  result = result.replace(/`([^`\n]+)`/g, "$1");
  result = result.replace(/\|\|([^|]+)\|\|/g, "$1");
  result = result.replace(/\*\*\*([^*]+)\*\*\*/g, "$1");
  result = result.replace(/___([^_]+)___/g, "$1");
  result = result.replace(/\*\*([^*]+)\*\*/g, "$1");
  result = result.replace(/__([^_\n]+)__/g, "$1");
  result = result.replace(/~~([^~]+)~~/g, "$1");
  result = result.replace(/(?<![*\w])\*([^*\n]+)\*(?![*\w])/g, "$1");
  result = result.replace(/(?<![\w])_([^_\n]+)_(?![\w])/g, "$1");
  result = result.replace(
    /\[([^\]]+)\]\((?:https?:\/\/|discord:)[^)]+\)/gi,
    "$1"
  );
  result = result.replace(/<(https?:\/\/[^>\s]+)>/g, "$1");
  result = result.replace(/^#{1,3}\s+/gm, "");
  result = result.replace(/^-#\s+/gm, "");
  result = result.replace(/^>\s?/gm, "");
  result = result.replace(/^[*\-]\s+/gm, "");

  return result;
}

function pushTextPart(parts: AnnouncementTextPart[], value: string) {
  const cleaned = stripMarkdown(value);
  if (!cleaned) return;
  const last = parts[parts.length - 1];
  if (last?.type === "text") {
    last.value += cleaned;
  } else {
    parts.push({ type: "text", value: cleaned });
  }
}

/** Parse announcement content — keeps @everyone, @here, role pings, and channel pings. */
export function parseAnnouncementContent(
  text: string,
  roles: DiscordRole[],
  guildId: string,
  channels: DiscordGuildChannel[]
): AnnouncementTextPart[] {
  const roleMap = new Map(roles.map((role) => [role.id, role]));
  const channelMap = new Map(channels.map((channel) => [channel.id, channel]));
  const parts: AnnouncementTextPart[] = [];
  let lastIndex = 0;

  for (const match of text.replace(/\0/g, "").matchAll(DISCORD_TOKEN_PATTERN)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      pushTextPart(parts, text.slice(lastIndex, index));
    }

    const token = match[0];
    const roleId = match[1];
    const channelId = match[3];

    if (roleId) {
      const role = roleMap.get(roleId);
      parts.push({
        type: "role",
        value: role ? `@${role.name}` : "@role",
        color: role ? discordColorToHex(role.color) : null,
      });
    } else if (channelId) {
      const channel = channelMap.get(channelId);
      parts.push({
        type: "channel",
        value: channel ? `#${channel.name}` : "#channel",
        url: buildDiscordChannelUrl(guildId, channelId),
      });
    } else if (/^@everyone$/i.test(token) || /^@here$/i.test(token)) {
      parts.push({ type: "everyone", value: token });
    }

    lastIndex = index + token.length;
  }

  if (lastIndex < text.length) {
    pushTextPart(parts, text.slice(lastIndex));
  }

  if (parts.length === 0) {
    const fallback = stripMarkdown(text).trim();
    if (fallback) {
      parts.push({ type: "text", value: fallback });
    }
  }

  return parts;
}

/** @deprecated Use parseAnnouncementContent */
export function formatAnnouncementText(text: string): string {
  return parseAnnouncementContent(text, [], "", [])
    .map((part) => part.value)
    .join("")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** @deprecated Use parseAnnouncementContent */
export function stripDiscordMentions(text: string): string {
  return formatAnnouncementText(text);
}

export function buildDiscordChannelUrl(
  guildId: string,
  channelId: string
): string {
  return `https://discord.com/channels/${guildId}/${channelId}`;
}

export function buildDiscordMessageUrl(
  guildId: string,
  channelId: string,
  messageId: string
): string {
  return `https://discord.com/channels/${guildId}/${channelId}/${messageId}`;
}
