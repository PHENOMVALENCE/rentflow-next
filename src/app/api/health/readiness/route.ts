import { db, hasDatabaseConfiguration } from "@/server/db";
import { hasPrivateObjectStorage } from "@/server/storage/private-object-store";

export const runtime = "nodejs";

export async function GET() {
  const persistenceConfigured = hasDatabaseConfiguration();
  let persistence = persistenceConfigured ? "checking" : "not_configured";

  if (persistenceConfigured) {
    try {
      await db.$queryRaw`SELECT 1`;
      persistence = "ready";
    } catch (error) {
      console.error("readiness_database_check_failed", error);
      persistence = "unavailable";
    }
  }

  const auth = Boolean(process.env.AUTH_SECRET) ? "configured" : "not_configured";
  const payments = Boolean(process.env.SNIPPE_API_KEY && process.env.SNIPPE_WEBHOOK_SECRET && process.env.SNIPPE_WEBHOOK_URL)
    ? "configured"
    : "not_configured";
  const scheduler = Boolean(process.env.CRON_SECRET) ? "configured" : "not_configured";
  const privateStorage = hasPrivateObjectStorage() ? "configured" : "not_configured";

  const ok = persistence !== "unavailable";
  return Response.json(
    {
      ok,
      service: "rentflow-next",
      mode: persistenceConfigured ? "persistent" : "preview",
      checks: {
        persistence,
        auth,
        payments,
        scheduler,
        privateStorage,
      },
    },
    { status: ok ? 200 : 503 },
  );
}
