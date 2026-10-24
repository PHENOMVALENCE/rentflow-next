import { toCsv } from "@/lib/csv";
import { requireSession } from "@/server/auth/session";
import { runReport } from "@/server/rentflow/report-runner";

export const dynamic = "force-dynamic";

/** CSV download of a catalog report, scoped exactly like the on-screen report. */
export async function GET(request: Request) {
  const session = await requireSession(["PLATFORM_ADMIN", "LANDLORD", "PROPERTY_ADMIN"]);
  const url = new URL(request.url);
  const category = url.searchParams.get("category") ?? "";
  const report = url.searchParams.get("report") ?? "";
  const result = await runReport(session, category, report);
  if (!result) return new Response("Unknown report", { status: 404 });
  if (result.status !== "ok") return new Response(result.reason, { status: 409 });

  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(toCsv(result.columns, result.rows), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="rentflow-${category}-${report}-${stamp}.csv"`,
      "cache-control": "no-store",
    },
  });
}
