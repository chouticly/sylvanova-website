export const SITE_NAME = "SylvaNova";

export const TAGLINE = "A forest is growing. Something new takes root.";

export const DISCORD_INVITE_URL = "#";

/** Set to true when ready to show Discord OAuth sign-in on the landing page. */
export const SHOW_DISCORD_LOGIN = false;

export const SEASON_DURATION_MS = 75_000;
export const SEASON_CYCLE_MS = SEASON_DURATION_MS * 4;

export const SEASONS = ["spring", "summer", "fall", "winter"] as const;
export type Season = (typeof SEASONS)[number];

export const TIME_BUCKETS = ["dawn", "day", "dusk", "night"] as const;
export type TimeOfDay = (typeof TIME_BUCKETS)[number];
