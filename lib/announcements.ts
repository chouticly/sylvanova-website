import {
  ANNOUNCEMENT_CACHE_TTL_MS,
  ANNOUNCEMENT_MAX_MESSAGES,
} from "./constants";
import {
  buildDiscordMessageUrl,
  fetchChannelMessages,
  fetchGuildChannels,
  fetchGuildMember,
  fetchGuildRoles,
  hasEveryoneMention,
  isDiscordBotConfigured,
  parseAnnouncementContent,
  resolveAvatarUrl,
  resolveNickname,
  resolveRoleColor,
  type AnnouncementTextPart,
  type DiscordEmbed,
  type DiscordGuildChannel,
  type DiscordMessage,
  type DiscordRole,
} from "./discord-bot";

export type { AnnouncementTextPart };

export interface AnnouncementEmbed {
  titleParts?: AnnouncementTextPart[];
  descriptionParts?: AnnouncementTextPart[];
  url?: string;
  imageUrl?: string;
}

export interface AnnouncementAuthor {
  nickname: string;
  avatarUrl: string;
  roleColor: string | null;
}

export interface Announcement {
  id: string;
  createdAt: string;
  mentionEveryone: boolean;
  discordUrl: string;
  author: AnnouncementAuthor;
  contentParts: AnnouncementTextPart[];
  embeds: AnnouncementEmbed[];
}

interface AnnouncementCache {
  data: Announcement[];
  expiresAt: number;
}

let cache: AnnouncementCache | null = null;

function normalizeEmbeds(
  embeds: DiscordEmbed[],
  roles: DiscordRole[],
  guildId: string,
  channels: DiscordGuildChannel[]
): AnnouncementEmbed[] {
  return embeds.map((embed) => ({
    titleParts: embed.title
      ? parseAnnouncementContent(embed.title, roles, guildId, channels)
      : undefined,
    descriptionParts: embed.description
      ? parseAnnouncementContent(embed.description, roles, guildId, channels)
      : undefined,
    url: embed.url || undefined,
    imageUrl: embed.image?.url || embed.thumbnail?.url || undefined,
  }));
}

async function enrichMessage(
  message: DiscordMessage,
  guildId: string,
  channelId: string,
  roles: DiscordRole[],
  channels: DiscordGuildChannel[]
): Promise<Announcement> {
  const member = await fetchGuildMember(guildId, message.author.id);

  return {
    id: message.id,
    createdAt: message.timestamp,
    mentionEveryone: hasEveryoneMention(message),
    discordUrl: buildDiscordMessageUrl(guildId, channelId, message.id),
    author: {
      nickname: resolveNickname(member, message.author),
      avatarUrl: resolveAvatarUrl(guildId, member, message.author),
      roleColor: member ? resolveRoleColor(member.roles, roles) : null,
    },
    contentParts: parseAnnouncementContent(
      message.content,
      roles,
      guildId,
      channels
    ),
    embeds: normalizeEmbeds(message.embeds, roles, guildId, channels),
  };
}

function sortAnnouncements(announcements: Announcement[]): Announcement[] {
  return [...announcements].sort((a, b) => {
    if (a.mentionEveryone !== b.mentionEveryone) {
      return a.mentionEveryone ? -1 : 1;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export async function getAnnouncements(): Promise<Announcement[]> {
  if (!isDiscordBotConfigured()) {
    return [];
  }

  if (cache && cache.expiresAt > Date.now()) {
    return cache.data;
  }

  const guildId = process.env.DISCORD_GUILD_ID!;
  const channelId = process.env.DISCORD_ANNOUNCEMENT_CHANNEL_ID!;

  try {
    const [messages, roles, channels] = await Promise.all([
      fetchChannelMessages(channelId, ANNOUNCEMENT_MAX_MESSAGES),
      fetchGuildRoles(guildId),
      fetchGuildChannels(guildId),
    ]);

    const enriched = await Promise.all(
      messages.map((message) =>
        enrichMessage(message, guildId, channelId, roles, channels)
      )
    );

    const sorted = sortAnnouncements(enriched);

    cache = {
      data: sorted,
      expiresAt: Date.now() + ANNOUNCEMENT_CACHE_TTL_MS,
    };

    return sorted;
  } catch {
    return cache?.data ?? [];
  }
}

export function getAnnouncementCacheTtlSeconds(): number {
  return Math.floor(ANNOUNCEMENT_CACHE_TTL_MS / 1000);
}

function hasEmbedContent(embed: AnnouncementEmbed): boolean {
  return Boolean(
    embed.titleParts?.length ||
      embed.descriptionParts?.length ||
      embed.imageUrl
  );
}

export function announcementHasBody(announcement: Announcement): boolean {
  return (
    announcement.contentParts.length > 0 ||
    announcement.embeds.some(hasEmbedContent)
  );
}
