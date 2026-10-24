import { runLeaseReminders } from "@/server/rentflow/lease-reminders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Daily 08:00 EAT (05:00 UTC) — Laravel `leases:send-reminders`. Protected by CRON_SECRET; safe to re-run. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const result = await runLeaseReminders();
  return Response.json({ ok: true, ...result });
}
