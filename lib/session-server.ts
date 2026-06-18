import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, type SessionData } from "@/lib/session";

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}
