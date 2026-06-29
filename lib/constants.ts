export const SITE_NAME = "SylvaNova";

export const COMPANY_NAME = "SylvaNova, LLC";

export const COMPANY_TAGLINE = "Gaming community";

export const SHOW_SITE_FOOTER = true;

export const TAGLINE = "A forest is growing. Something new takes root.";

export const DISCORD_INVITE_URL = "https://discord.gg/sylvanova";

/** Set to true when ready to show Discord OAuth sign-in on the landing page. */
export const SHOW_DISCORD_LOGIN = false;

export const SEASON_DURATION_MS = 75_000;
export const SEASON_CYCLE_MS = SEASON_DURATION_MS * 4;

export const SEASONS = ["spring", "summer", "fall", "winter"] as const;
export type Season = (typeof SEASONS)[number];

export const TIME_BUCKETS = ["dawn", "day", "dusk", "night"] as const;
export type TimeOfDay = (typeof TIME_BUCKETS)[number];

export const ANNOUNCEMENT_CACHE_TTL_MS = 60_000;
export const ANNOUNCEMENT_MAX_MESSAGES = 25;
export const ANNOUNCEMENT_EVERYONE_DURATION_MS = 12_000;
export const ANNOUNCEMENT_CYCLE_DURATION_MS = 7_000;
export const ANNOUNCEMENT_REDUCED_MOTION_DURATION_MS = 20_000;
export const ANNOUNCEMENT_SCROLL_END_PAUSE_MS = 10_000;
export const ANNOUNCEMENT_SCROLL_PX_PER_SEC = 28;
export const ANNOUNCEMENT_SCROLL_START_DELAY_MS = 800;

/** Client poll interval — matches server cache TTL. */
export const ANNOUNCEMENT_POLL_INTERVAL_MS = ANNOUNCEMENT_CACHE_TTL_MS;

export const SHOW_ANNOUNCEMENTS =
  typeof process !== "undefined" &&
  Boolean(
    process.env.DISCORD_BOT_TOKEN &&
      process.env.DISCORD_GUILD_ID &&
      process.env.DISCORD_ANNOUNCEMENT_CHANNEL_ID
  );
