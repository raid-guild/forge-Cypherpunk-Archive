import { NextResponse } from "next/server";
import { dailyDate } from "@/lib/daily";
import { recordDailyHint, upsertUser } from "@/lib/db";
import { getCurrentSession } from "@/lib/portal-session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  const session = await getCurrentSession();
  if (!session.authenticated) {
    return NextResponse.json({ authenticated: false });
  }

  upsertUser(session);
  recordDailyHint(session.portalUserID, dailyDate());
  return NextResponse.json({ authenticated: true });
}
