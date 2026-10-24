"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/server/auth/session";
import { db } from "@/server/db";

const protectedLeaseStates = ["AWAITING_PAYMENT", "ACTIVE", "RENEWAL_WINDOW", "GRACE"] as const;

function rowsFromCsv(text: string) {
  const lines = text.trim().split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) throw new Error("Include a header row and at least one data row.");
  const parse = (line: string) => {
    const cells: string[] = [];
    let value = "";
    let quoted = false;
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      if (char === '"') {
        if (quoted && line[i + 1] === '"') { value += '"'; i += 1; }
        else quoted = !quoted;
      } else if (char === "," && !quoted) { cells.push(value.trim()); value = ""; }
      else value += char;
    }
    cells.push(value.trim());
    return cells;
  };
  const header = parse(lines[0]).map((value) => value.toLowerCase());
  return lines.slice(1).map((line, index) => {
    const values = parse(line);
    return { line: index + 2, data: Object.fromEntries(header.map((key, column) => [key, values[column] ?? ""])) };
  });
}

function truthy(value: string) {
  return ["1", "yes", "y", "true", "paid"].includes(value.trim().toLowerCase());
}

function addMonths(date: Date, months: number) {
  const result = new Date(date);
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
}

function enumValue<T extends string>(value: string, allowed: readonly T[], fallback: T) {
  const normalized = value.trim().toUpperCase() as T;
  return allowed.includes(normalized) ? normalized : fallback;
}

export async function importExistingPortfolio(formData: FormData) {
  const session = await requireSession(["LANDLORD", "PROPERTY_ADMIN", "PLATFORM_ADMIN"]);
  if (!session.organizationId) throw new Error("An organization workspace is required.");
  const text = String(formData.get("csv") ?? "").trim();
  const rows = rowsFromCsv(text);
  const errors: string[] = [];
  let imported = 0;

  for (const row of rows) {
    try {
      await db.$transaction(async (tx) => {
        const data = row.data;
        const propertyName = data.property_name?.trim() ?? "";
        const wardCode = data.ward_postcode?.trim() ?? "";
        const unitNumber = data.unit_number?.trim() ?? "";
        const tenantName = data.tenant_name?.trim() ?? "";
        const phone = data.phone?.trim() ?? "";
        const termMonths = Number(data.term_months ?? 0);
        const fullTermAmount = Number(String(data.full_term_amount ?? "").replaceAll(",", ""));
        if (!propertyName || !wardCode || !unitNumber || !tenantName) throw new Error("property_name, ward_postcode, unit_number and tenant_name are required");
        if (![3, 6].includes(termMonths)) throw new Error("term_months must be 3 or 6");
        if (!Number.isFinite(fullTermAmount) || fullTermAmount <= 0) throw new Error("full_term_amount must be greater than zero");

        const ward = await tx.ward.findFirst({ where: { code: wardCode }, include: { district: { include: { region: true } } } });
        if (!ward) throw new Error(`Unknown ward postcode/code ${wardCode}; import geography first`);
        const propertyType = enumValue(data.property_type ?? "", ["RESIDENTIAL", "COMMERCIAL", "MIXED_USE"] as const, "RESIDENTIAL");
        const unitType = enumValue(data.unit_type ?? "", ["APARTMENT", "SHOP", "OFFICE", "STORE", "OTHER"] as const, "APARTMENT");

        let property = await tx.property.findFirst({ where: { organizationId: session.organizationId!, name: propertyName, ward: ward.name } });
        if (!property) {
          property = await tx.property.create({
            data: {
              organizationId: session.organizationId!,
              name: propertyName,
              type: propertyType,
              address: data.street_village?.trim() || ward.name,
              region: ward.district.region.name,
              district: ward.district.name,
              ward: ward.name,
              streetVillage: data.street_village?.trim() || null,
            },
          });
        }

        let unit = await tx.unit.findFirst({ where: { propertyId: property.id, unitNumber } });
        if (!unit) {
          const monthly = Number(String(data.indicative_monthly_rent ?? "").replaceAll(",", ""));
          unit = await tx.unit.create({ data: { propertyId: property.id, unitNumber, type: unitType, monthlyRent: Number.isFinite(monthly) && monthly > 0 ? monthly : fullTermAmount / termMonths, currency: "TZS" } });
        }
        const blocking = await tx.lease.findFirst({ where: { unitId: unit.id, status: { in: [...protectedLeaseStates] } } });
        if (blocking) throw new Error(`Unit ${unitNumber} already has a blocking lease`);

        let tenant = phone ? await tx.tenant.findFirst({ where: { organizationId: session.organizationId!, phone } }) : null;
        tenant ??= await tx.tenant.findFirst({ where: { organizationId: session.organizationId!, name: tenantName, ...(phone ? { phone: "" } : {}) } });
        tenant ??= await tx.tenant.create({ data: { organizationId: session.organizationId!, name: tenantName, phone, status: "ACTIVE" } });

        const startDate = data.start_date?.trim() ? new Date(data.start_date) : new Date();
        if (Number.isNaN(startDate.getTime())) throw new Error("start_date is invalid");
        const paid = truthy(data.already_paid ?? "");
        const lease = await tx.lease.create({ data: { unitId: unit.id, tenantId: tenant.id, termMonths, startDate, endDate: addMonths(startDate, termMonths), fullTermAmount, currency: "TZS", status: paid ? "ACTIVE" : "AWAITING_PAYMENT" } });
        const obligation = await tx.paymentObligation.create({ data: { leaseId: lease.id, internalReference: `RF-IMP-${lease.id.toUpperCase()}`, amount: fullTermAmount, currency: "TZS", status: paid ? "PAID" : "PENDING", dueAt: startDate } });
        if (paid) {
          await tx.receipt.create({ data: { obligationId: obligation.id, receiptNo: `RF-IMP-${Date.now()}-${row.line}`, amount: fullTermAmount, currency: "TZS" } });
        }
      });
      imported += 1;
    } catch (error) {
      errors.push(`Row ${row.line}: ${error instanceof Error ? error.message : "Import failed"}`);
    }
  }

  await db.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, action: "portfolio.imported", resourceType: "Organization", resourceId: session.organizationId, metadata: { imported, errors } } });
  revalidatePath("/app/properties"); revalidatePath("/app/units"); revalidatePath("/app/tenants"); revalidatePath("/app/leases");
  const query = new URLSearchParams({ imported: String(imported), errors: errors.join(" | ").slice(0, 1500) });
  redirect(`/app/tenants/import?${query.toString()}`);
}
