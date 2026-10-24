export const reportCatalog = {
  overview: { label: "Overview", reports: { summary: "Overview" } },
  performance: { label: "Performance", reports: { scorecard: "Property scorecard", collections: "Collections by month", renewals: "Renewals and turnover", records: "Lease records" } },
  properties: { label: "Properties", reports: { properties: "Properties", buildings: "Buildings", units: "Units", occupancy: "Occupancy" } },
  leases: { label: "Leases", reports: { performance: "Lease performance", expiring: "Expiring leases", history: "Lease history" } },
  financial: { label: "Financial", reports: { collections: "Rent & collections", statement: "Rent statement", "by-lease": "Rent by lease", outstanding: "Outstanding rent", overdue: "Overdue tenants", payments: "Payment history", expenses: "Expenses", summary: "Financial summary" } },
  tenants: { label: "Tenants", reports: { overview: "Tenant overview", status: "Tenant status", history: "Tenant history" } },
  maintenance: { label: "Maintenance", reports: { overview: "Maintenance overview", open: "Open requests", resolution: "Resolution" } },
  supervisors: { label: "Supervisors", reports: { activity: "Activity", assignments: "Assigned properties" } },
  compliance: { label: "Compliance", reports: { leases: "Lease compliance", records: "Tenant records", documents: "Documents", controls: "Financial controls", data: "Data checks", audit: "Audit reports", saved: "Saved reports" } },
} as const;

export type ReportCategory = keyof typeof reportCatalog;

export function hasReport(category: string, report: string): category is ReportCategory {
  return category in reportCatalog && report in reportCatalog[category as ReportCategory].reports;
}

export function reportLabel(category: string, report: string) {
  if (!hasReport(category, report)) return null;
  return reportCatalog[category].reports[report as keyof (typeof reportCatalog)[typeof category]["reports"]] as string;
}
