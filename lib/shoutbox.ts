const DISCORD_API = "https://discord.com/api/v10";
const MAX_MESSAGE_LENGTH = 500;

export interface ShoutboxMessage {
  id: string;
  content: string;
  authorName: string;
  authorAvatar: string | null;
  timestamp: string;
}

interface DiscordMessage {
  id: string;
  content: string;
  timestamp: string;
  author: {
    id: string;
    username: string;
    global_name: string | null;
    avatar: string | null;
    discriminator: string;
  };
  webhook_id?: string;
  embeds?: Array<{ title?: string; description?: string }>;
  attachments?: Array<{ filename: string }>;
}

function getDisplayContent(message: DiscordMessage): string | null {
  const text = message.content.trim();
  if (text) return text;

  const embed = message.embeds?.[0];
  if (embed?.description?.trim()) return embed.description.trim();
  if (embed?.title?.trim()) return embed.title.trim();

  const attachment = message.attachments?.[0];
  if (attachment) return `[attachment: ${attachment.filename}]`;

  return null;
}

function getBotToken(): string {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) {
    throw new Error("Discord shoutbox is not configured");
  }
  return token;
}

function getChannelId(): string {
  const channelId = process.env.DISCORD_SHOUTBOX_CHANNEL_ID;
  if (!channelId) {
    throw new Error("Discord shoutbox is not configured");
  }
  return channelId;
}

export function getShoutboxChannelId(): string {
  return getChannelId();
}

function getWebhookUrl(): string {
  const url = process.env.DISCORD_SHOUTBOX_WEBHOOK_URL;
  if (!url) {
    throw new Error("Discord shoutbox is not configured");
  }
  return url;
}

export function getShoutboxUsername(): string {
  return process.env.SHOUTBOX_USERNAME || "cooldude67";
}

export function sanitizeMessageContent(content: string): string {
  return content.replace(/\0/g, "").trim().slice(0, MAX_MESSAGE_LENGTH);
}

function getAuthorAvatar(author: DiscordMessage["author"]): string | null {
  if (author.avatar) {
    return `https://cdn.discordapp.com/avatars/${author.id}/${author.avatar}.png?size=64`;
  }
  const disc = Number(author.discriminator);
  const defaultIndex = Number.isFinite(disc) && disc > 0 ? disc % 5 : 0;
  return `https://cdn.discordapp.com/embed/avatars/${defaultIndex}.png`;
}

function normalizeMessage(message: DiscordMessage): ShoutboxMessage | null {
  const content = getDisplayContent(message);
  if (!content) return null;

  return {
    id: message.id,
    content,
    authorName: message.author.global_name || message.author.username,
    authorAvatar: getAuthorAvatar(message.author),
    timestamp: message.timestamp,
  };
}

export function normalizeDiscordMessage(
  message: DiscordMessage
): ShoutboxMessage | null {
  return normalizeMessage(message);
}

export async function fetchChannelMessages(
  limit = 50
): Promise<ShoutboxMessage[]> {
  const token = getBotToken();
  const channelId = getChannelId();

  const response = await fetch(
    `${DISCORD_API}/channels/${channelId}/messages?limit=${limit}`,
    {
      headers: { Authorization: `Bot ${token}` },
      next: { revalidate: 0 },
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch messages: ${text}`);
  }

  const data = (await response.json()) as DiscordMessage[];
  return data
    .map(normalizeMessage)
    .filter((message): message is ShoutboxMessage => message !== null)
    .reverse();
}

export async function postShoutboxMessage(content: string): Promise<void> {
  const webhookUrl = getWebhookUrl();
  const username = getShoutboxUsername();
  const sanitized = sanitizeMessageContent(content);

  if (!sanitized) {
    throw new Error("Message cannot be empty");
  }

  const response = await fetch(`${webhookUrl}?wait=true`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, content: sanitized }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to post message: ${text}`);
  }
}

export function isShoutboxConfigured(): boolean {
  return Boolean(
    process.env.DISCORD_BOT_TOKEN &&
      process.env.DISCORD_SHOUTBOX_CHANNEL_ID &&
      process.env.DISCORD_SHOUTBOX_WEBHOOK_URL &&
      process.env.SHOUTBOX_POST_PASSWORD
  );
}
