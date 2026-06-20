import {
  Client,
  Events,
  GatewayIntentBits,
  type Message as GatewayMessage,
} from "discord.js";
import {
  fetchChannelMessages,
  getShoutboxChannelId,
  isShoutboxConfigured,
  type ShoutboxMessage,
} from "@/lib/shoutbox";

const MAX_MESSAGES = 50;
const FALLBACK_POLL_MS = 1000;

type Listener = (messages: ShoutboxMessage[]) => void;

function normalizeGatewayMessage(message: GatewayMessage): ShoutboxMessage | null {
  const content = message.content.trim();
  if (content) {
    return {
      id: message.id,
      content,
      authorName: message.author.displayName || message.author.username,
      authorAvatar: message.author.displayAvatarURL({ size: 64 }),
      timestamp: message.createdAt.toISOString(),
    };
  }

  const embed = message.embeds[0];
  if (embed?.description?.trim()) {
    return {
      id: message.id,
      content: embed.description.trim(),
      authorName: message.author.displayName || message.author.username,
      authorAvatar: message.author.displayAvatarURL({ size: 64 }),
      timestamp: message.createdAt.toISOString(),
    };
  }
  if (embed?.title?.trim()) {
    return {
      id: message.id,
      content: embed.title.trim(),
      authorName: message.author.displayName || message.author.username,
      authorAvatar: message.author.displayAvatarURL({ size: 64 }),
      timestamp: message.createdAt.toISOString(),
    };
  }

  const attachment = message.attachments.first();
  if (attachment) {
    return {
      id: message.id,
      content: `[attachment: ${attachment.name}]`,
      authorName: message.author.displayName || message.author.username,
      authorAvatar: message.author.displayAvatarURL({ size: 64 }),
      timestamp: message.createdAt.toISOString(),
    };
  }

  return null;
}

function messagesEqual(a: ShoutboxMessage[], b: ShoutboxMessage[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((message, index) => message.id === b[index]?.id);
}

class ShoutboxLiveService {
  private client: Client | null = null;
  private messages: ShoutboxMessage[] = [];
  private listeners = new Set<Listener>();
  private subscriberCount = 0;
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private starting = false;
  private gatewayReady = false;

  getMessages(): ShoutboxMessage[] {
    return this.messages;
  }

  subscribe(listener: Listener): () => void {
    this.subscriberCount += 1;
    this.listeners.add(listener);
    listener(this.messages);
    void this.ensureStarted();

    return () => {
      this.listeners.delete(listener);
      this.subscriberCount -= 1;
      if (this.subscriberCount <= 0) {
        this.stopFallbackPolling();
      }
    };
  }

  private notify(): void {
    const snapshot = [...this.messages];
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }

  private async ensureStarted(): Promise<void> {
    if (!isShoutboxConfigured() || this.starting) return;
    if (this.gatewayReady) return;
    if (this.client && !this.client.isReady()) return;

    this.starting = true;
    try {
      await this.startGateway();
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("[shoutbox-live] Gateway failed, using fast polling:", error);
      }
      this.startFallbackPolling();
    } finally {
      this.starting = false;
    }
  }

  private async startGateway(): Promise<void> {
    if (this.client?.isReady()) {
      this.gatewayReady = true;
      return;
    }

    const token = process.env.DISCORD_BOT_TOKEN;
    if (!token) {
      throw new Error("Missing bot token");
    }

    const channelId = getShoutboxChannelId();
    const client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });

    client.on(Events.ClientReady, async () => {
      this.gatewayReady = true;
      this.stopFallbackPolling();
      try {
        this.messages = await fetchChannelMessages(MAX_MESSAGES);
        this.notify();
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("[shoutbox-live] Initial fetch failed:", error);
        }
      }
    });

    client.on(Events.MessageCreate, (message) => {
      if (message.channelId !== channelId) return;
      const normalized = normalizeGatewayMessage(message);
      if (!normalized) return;

      if (this.messages.some((entry) => entry.id === normalized.id)) return;
      this.messages = [...this.messages, normalized].slice(-MAX_MESSAGES);
      this.notify();
    });

    client.on(Events.MessageUpdate, (_oldMessage, message) => {
      if (message.channelId !== channelId) return;
      const normalized = normalizeGatewayMessage(message);
      if (!normalized) {
        this.messages = this.messages.filter((entry) => entry.id !== message.id);
      } else {
        const index = this.messages.findIndex((entry) => entry.id === normalized.id);
        if (index >= 0) {
          this.messages = [
            ...this.messages.slice(0, index),
            normalized,
            ...this.messages.slice(index + 1),
          ];
        }
      }
      this.notify();
    });

    client.on(Events.MessageDelete, (message) => {
      if (message.channelId !== channelId) return;
      this.messages = this.messages.filter((entry) => entry.id !== message.id);
      this.notify();
    });

    await client.login(token);
    this.client = client;
  }

  private startFallbackPolling(): void {
    if (this.pollInterval) return;

    const poll = async () => {
      if (this.subscriberCount <= 0) return;
      try {
        const fresh = await fetchChannelMessages(MAX_MESSAGES);
        if (!messagesEqual(this.messages, fresh)) {
          this.messages = fresh;
          this.notify();
        }
      } catch {
        // ignore transient errors while polling
      }
    };

    void poll();
    this.pollInterval = setInterval(poll, FALLBACK_POLL_MS);
  }

  private stopFallbackPolling(): void {
    if (!this.pollInterval) return;
    clearInterval(this.pollInterval);
    this.pollInterval = null;
  }
}

const globalForShoutbox = globalThis as typeof globalThis & {
  shoutboxLive?: ShoutboxLiveService;
};

export function getShoutboxLiveService(): ShoutboxLiveService {
  if (!globalForShoutbox.shoutboxLive) {
    globalForShoutbox.shoutboxLive = new ShoutboxLiveService();
  }
  return globalForShoutbox.shoutboxLive;
}
