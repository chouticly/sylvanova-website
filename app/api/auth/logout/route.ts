import { NextResponse } from "next/server";
import { getSession } from "@/lib/session-server";

export async function POST() {
  const session = await getSession();
  session.destroy();
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const session = await getSession();
  session.destroy();
  return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"));
}
