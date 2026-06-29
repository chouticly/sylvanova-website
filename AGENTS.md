# AGENTS.md

## Cursor Cloud specific instructions

SylvaNova is a single Next.js 15 (App Router) + React 19 landing page for a gaming
community. There is no backend service or database beyond Next.js itself; optional
features call the Discord REST API directly.

Standard commands live in `package.json` (`dev`, `build`, `start`, `lint`). Run the dev
server with `npm run dev` (serves on port 3000). Lint with `npm run lint` (uses
`next lint`; one pre-existing `react-hooks/exhaustive-deps` warning is expected and not a
failure). There is no automated test suite.

Non-obvious notes:

- The app runs fully without any environment variables. Discord OAuth, announcement sync,
  and the Shoutbox live chat are all optional and degrade gracefully when their env vars
  are absent: `SESSION_SECRET` falls back to a built-in default, `/api/announcements`
  returns `{"announcements":[]}`, and the Shoutbox drawer shows "Chat is not available
  right now". So a blank Shoutbox or missing announcements in dev is expected, not a bug.
- `SHOW_DISCORD_LOGIN` and `SHOW_SITE_FOOTER` in `lib/constants.ts` are hardcoded `false`,
  so the Discord login button and footer are intentionally hidden on the landing page.
- To exercise the Discord-dependent features, copy `.env.example` to `.env.local` and fill
  in real Discord credentials (see `README.md`). These require a real Discord application,
  bot token, guild/channel IDs, and (for Shoutbox) a webhook — they cannot be tested
  without external Discord setup.
- `npm run build` / `npm start` and `docker compose up` are production paths; use
  `npm run dev` for development.
