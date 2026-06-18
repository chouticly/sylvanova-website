# SylvaNova Website

An under-construction landing page for the **SylvaNova** gaming community. Features an illustrated Aspen forest background with seasonal color cycling, time-of-day sky adaptation, light/dark themes, and Discord OAuth login.

## Features

- Illustrated SVG Aspen forest with parallax and sway animations
- Seasons cycle continuously (spring → summer → fall → winter) every ~5 minutes
- Sky adapts to visitor's local time (dawn / day / dusk / night)
- Light and dark theme toggle (defaults to system preference)
- Discord OAuth sign-in scaffolding
- Responsive layout for mobile and desktop
- Respects `prefers-reduced-motion`

## Prerequisites

- Node.js 20+
- A [Discord Application](https://discord.com/developers/applications) for OAuth

## Setup

1. **Clone and install**

   ```bash
   npm install
   ```

2. **Configure environment**

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your values:

   | Variable | Description |
   |----------|-------------|
   | `DISCORD_CLIENT_ID` | Discord app Client ID |
   | `DISCORD_CLIENT_SECRET` | Discord app Client Secret |
   | `DISCORD_REDIRECT_URI` | OAuth callback URL |
   | `SESSION_SECRET` | Random 32+ character string for session encryption |
   | `NEXT_PUBLIC_BASE_URL` | Your site URL (e.g. `https://sylvanova.example.com`) |

3. **Configure Discord OAuth**

   In your Discord Application settings:

   - Go to **OAuth2** → add redirect URI: `http://localhost:3000/api/auth/callback/discord`
   - For production, add your production callback URL too
   - Copy the Client ID and Client Secret into `.env.local`

4. **Run locally**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Production (Self-Hosted)

### One-command package

Creates a self-contained bundle in `release/sylvanova-website/` and a tarball at `release/sylvanova-website.tar.gz`:

```bash
npm run package:prod
```

On the server, unpack (if using the archive), copy `.env.example` to `.env`, set variables, then:

```bash
./start.sh
```

### PM2 (recommended)

```bash
pm2 delete sylvanova 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save
```

### Manual build

```bash
npm run build
npm start
```

Use a reverse proxy (nginx, Caddy, etc.) with **HTTPS** in production.

Production environment variables:

```
DISCORD_REDIRECT_URI=https://yourdomain.com/api/auth/callback/discord
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
SESSION_SECRET=<strong-random-secret>
```

### Docker

```bash
cp .env.example .env.production
# edit .env.production

docker compose up -d --build
```

Or without compose:

```bash
docker build -t sylvanova-website .
docker run -p 3000:3000 --env-file .env.production sylvanova-website
```

## Customization

Edit [`lib/constants.ts`](lib/constants.ts) to change:

- `TAGLINE` — hero tagline text
- `DISCORD_INVITE_URL` — Discord invite link when ready
- `SEASON_DURATION_MS` — duration of each season in the cycle

## Project Structure

```
app/              Next.js App Router pages and API routes
components/       UI and scene components
hooks/            Time-of-day, season cycle, theme hooks
lib/              Colors, constants, Discord OAuth, session
```

## License

Private — SylvaNova community.
