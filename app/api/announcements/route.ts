import { NextResponse } from "next/server";
import {
  getAnnouncementCacheTtlSeconds,
  getAnnouncements,
} from "@/lib/announcements";

export async function GET() {
  const announcements = await getAnnouncements();

  return NextResponse.json(
    { announcements },
    {
      headers: {
        "Cache-Control": `public, s-maxage=${getAnnouncementCacheTtlSeconds()}, stale-while-revalidate=30`,
      },
    }
  );
}
