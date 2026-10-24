import Link from "next/link";
import { AppIcon } from "@/components/icons";
import { Empty, Metric, PageHeader, Panel } from "@/components/ui";
import { requireSession } from "@/server/auth/session";
import { getReportsSection } from "@/server/rentflow/operations-read-model";
import { listReports, runReport } from "@/server/rentflow/report-runner";

export const metadata = { title: "Reports" };

const MAX_ROWS_ON_SCREEN = 200;

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ category?: string; report?: string }> }) {
  const session = await requireSession(["PLATFORM_ADMIN", "LANDLORD", "PROPERTY_ADMIN"]);
  const { category = "", report = "" } = await searchParams;
  const [metrics, result] = await Promise.all([getReportsSection(session), category && report ? runReport(session, category, report) : null]);
  const catalog = listReports();

  return (
    <>
      <PageHeader
        title="Reports"
        description="Operational records from authoritative lease, payment and maintenance data. Every report is limited to your scope and can be exported as CSV."
        action={<Link href="/app/reports/audit" className="rf-btn-secondary"><AppIcon name="clock" className="h-4 w-4" /> Audit evidence</Link>}
      />

      <div className="rf-dash">
        <div className="rf-metrics">
          {metrics.slice(0, 4).map(([label, value]) => <Metric key={label} label={label} value={value} />)}
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[18rem_minmax(0,1fr)]">
          <nav aria-label="Report catalog" className="rf-panel p-3">
            {catalog.map((group) => (
              <div key={group.category} className="rf-nav-section">
                <p className="rf-nav-group">{group.label}</p>
                <div className="flex flex-col gap-0.5">
                  {group.reports.map((item) => {
                    const active = group.category === category && item.key === report;
                    return (
                      <Link key={item.key} href={`/app/reports?category=${group.category}&report=${item.key}`} aria-current={active ? "page" : undefined} className={`rf-nav-link${active ? " rf-nav-active" : ""}`}>
                        <span className="min-w-0 flex-1 truncate">{item.label}</span>
                        {!item.available && <span className="text-xs text-neutral-500">Later</span>}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="min-w-0">
            {!result ? (
              <Empty icon="chart" title={category ? "Unknown report" : "Choose a report"}>
                {category ? "That report is not in the catalog." : "Pick a report from the catalog to see its records and export them."}
              </Empty>
            ) : result.status === "unavailable" ? (
              <Empty icon="info" title={result.title}>{result.reason}</Empty>
            ) : (
              <Panel
                title={result.title}
                subtitle={`${result.rows.length} ${result.rows.length === 1 ? "record" : "records"}${result.note ? ` · ${result.note}` : ""}`}
                action={<a href={`/app/reports/export?category=${category}&report=${report}`} className="rf-btn-secondary"><AppIcon name="download" className="h-4 w-4" /> Export CSV</a>}
                flush
              >
                {result.rows.length === 0 ? (
                  <p className="rf-panel-empty px-4 pb-4 sm:px-5"><AppIcon name="check" className="h-4 w-4" /> No records in your scope.</p>
                ) : (
                  <div className="rf-table-wrap overflow-x-auto">
                    <table className="rf-table w-full text-left text-sm [&_td]:border-t [&_td]:border-[#e3e8ef] [&_td]:px-4 [&_td]:py-3 [&_th]:px-4 [&_th]:py-2.5">
                      <thead>
                        <tr>{result.columns.map((column) => <th key={column} scope="col" className="whitespace-nowrap">{column}</th>)}</tr>
                      </thead>
                      <tbody>
                        {result.rows.slice(0, MAX_ROWS_ON_SCREEN).map((row, index) => (
                          <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex} className={typeof cell === "number" ? "tabular-nums" : undefined}>{cell === null ? "—" : typeof cell === "number" ? cell.toLocaleString("en-US") : cell}</td>)}</tr>
                        ))}
                      </tbody>
                    </table>
                    {result.rows.length > MAX_ROWS_ON_SCREEN && <p className="px-4 py-3 text-xs text-[#51607a] sm:px-5">Showing the first {MAX_ROWS_ON_SCREEN} records. Export CSV for all {result.rows.length}.</p>}
                  </div>
                )}
              </Panel>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
