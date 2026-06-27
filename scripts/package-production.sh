#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RELEASE_DIR="$ROOT/release/sylvanova-website"
ARCHIVE="$ROOT/release/sylvanova-website.tar.gz"

cd "$ROOT"

echo "Installing dependencies..."
npm ci

echo "Building production bundle..."
npm run build

echo "Assembling standalone release..."
rm -rf "$RELEASE_DIR"
mkdir -p "$RELEASE_DIR"

cp -R .next/standalone/. "$RELEASE_DIR/"
mkdir -p "$RELEASE_DIR/.next"
cp -R .next/static "$RELEASE_DIR/.next/static"
cp -R public "$RELEASE_DIR/public"

cp .env.example "$RELEASE_DIR/.env.example"

cat > "$RELEASE_DIR/start.sh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
export NODE_ENV=production
export HOSTNAME="${HOSTNAME:-0.0.0.0}"
export PORT="${PORT:-3000}"
exec node server.js
EOF
chmod +x "$RELEASE_DIR/start.sh"

cat > "$RELEASE_DIR/README.txt" <<'EOF'
SylvaNova Website — Production Bundle

1. Copy .env.example to .env and fill in values (or set env vars another way).
2. Run: ./start.sh
   Or:  NODE_ENV=production node server.js

Required environment variables:
  SESSION_SECRET          Random string, 32+ characters
  DISCORD_CLIENT_ID       (optional until Discord login is enabled)
  DISCORD_CLIENT_SECRET   (optional until Discord login is enabled)
  DISCORD_REDIRECT_URI    e.g. https://yourdomain.com/api/auth/callback/discord
  DISCORD_BOT_TOKEN       Bot token for announcement channel sync
  DISCORD_GUILD_ID        Discord server ID
  DISCORD_ANNOUNCEMENT_CHANNEL_ID  Announcement channel ID
  NEXT_PUBLIC_BASE_URL    e.g. https://yourdomain.com

Default port: 3000 (override with PORT).
Put HTTPS in front of this app (nginx, Caddy, etc.) for production.
EOF

mkdir -p "$ROOT/release"
rm -f "$ARCHIVE"
tar -czf "$ARCHIVE" -C "$ROOT/release" sylvanova-website

echo ""
echo "Production package ready:"
echo "  Directory: $RELEASE_DIR"
echo "  Archive:   $ARCHIVE"
echo ""
du -sh "$RELEASE_DIR" "$ARCHIVE"
