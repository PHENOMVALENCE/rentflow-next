"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/server/auth/session";
import { db } from "@/server/db";

const MAX_FILE_BYTES = 2 * 1024 * 1024;
const MAX_ROWS = 5000;
const REQUIRED_HEADERS = [
  "region_code",
  "region_name",
  "district_code",
  "district_name",
  "ward_code",
  "ward_name",
  "street_village_name",
] as const;

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];

    if (character === '"') {
      if (quoted && next === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (character === "," && !quoted) {
      row.push(field.trim());
      field = "";
      continue;
    }

    if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && next === "\n") index += 1;
      row.push(field.trim());
      field = "";
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      continue;
    }

    field += character;
  }

  if (quoted) throw new Error("CSV contains an unterminated quoted field.");
  row.push(field.trim());
  if (row.some((value) => value.length > 0)) rows.push(row);
  return rows;
}

function rowObject(headers: string[], values: string[]) {
  return Object.fromEntries(headers.map((header, index) => [header, values[index]?.trim() ?? ""]));
}

function required(row: Record<string, string>, key: (typeof REQUIRED_HEADERS)[number]) {
  const value = row[key]?.trim();
  if (!value) throw new Error(`${key} is required.`);
  return value;
}

export async function importGeographyCsv(formData: FormData) {
  const session = await requireSession(["PLATFORM_ADMIN"]);
  const value = formData.get("file");
  if (!(value instanceof File)) throw new Error("Select a CSV file.");
  if (value.size <= 0 || value.size > MAX_FILE_BYTES) throw new Error("CSV file must be between 1 byte and 2 MB.");
  if (!value.name.toLowerCase().endsWith(".csv")) throw new Error("Only .csv files are accepted.");

  const text = (await value.text()).replace(/^\uFEFF/, "");
  const parsed = parseCsv(text);
  if (parsed.length < 2) throw new Error("CSV must include a header and at least one data row.");
  if (parsed.length - 1 > MAX_ROWS) throw new Error(`CSV may contain at most ${MAX_ROWS} data rows.`);

  const headers = parsed[0].map((header) => header.trim().toLowerCase());
  const missing = REQUIRED_HEADERS.filter((header) => !headers.includes(header));
  if (missing.length) throw new Error(`Missing CSV headers: ${missing.join(", ")}.`);

  const batch = await db.geoImportBatch.create({
    data: {
      sourceName: value.name,
      importedBy: session.userId,
      totalRows: parsed.length - 1,
    },
  });

  let successRows = 0;
  let failedRows = 0;

  for (let index = 1; index < parsed.length; index += 1) {
    const payload = rowObject(headers, parsed[index]);
    try {
      const regionCode = required(payload, "region_code");
      const regionName = required(payload, "region_name");
      const districtCode = required(payload, "district_code");
      const districtName = required(payload, "district_name");
      const wardCode = required(payload, "ward_code");
      const wardName = required(payload, "ward_name");
      const streetName = required(payload, "street_village_name");
      const kind = (payload.kind || "STREET").toUpperCase();
      if (kind !== "STREET" && kind !== "VILLAGE") throw new Error("kind must be STREET or VILLAGE.");

      await db.$transaction(async (tx) => {
        const region = await tx.region.upsert({
          where: { code: regionCode },
          create: { code: regionCode, name: regionName },
          update: { name: regionName },
        });
        const district = await tx.district.upsert({
          where: { regionId_code: { regionId: region.id, code: districtCode } },
          create: { regionId: region.id, code: districtCode, name: districtName },
          update: { name: districtName },
        });
        const ward = await tx.ward.upsert({
          where: { districtId_code: { districtId: district.id, code: wardCode } },
          create: { districtId: district.id, code: wardCode, name: wardName },
          update: { name: wardName },
        });
        const existingStreet = await tx.streetVillage.findFirst({
          where: { wardId: ward.id, name: streetName, kind },
          select: { id: true },
        });
        if (!existingStreet) await tx.streetVillage.create({ data: { wardId: ward.id, name: streetName, kind } });
        await tx.geoImportRecord.create({
          data: { batchId: batch.id, rowNumber: index + 1, status: "SUCCESS", payload },
        });
      });
      successRows += 1;
    } catch (error) {
      failedRows += 1;
      await db.geoImportRecord.create({
        data: {
          batchId: batch.id,
          rowNumber: index + 1,
          status: "FAILED",
          payload,
          error: error instanceof Error ? error.message.slice(0, 1000) : "Unknown import error",
        },
      });
    }
  }

  await db.geoImportBatch.update({
    where: { id: batch.id },
    data: { successRows, failedRows },
  });
  await db.auditLog.create({
    data: {
      actorId: session.userId,
      action: "geography.import_completed",
      resourceType: "GeoImportBatch",
      resourceId: batch.id,
      metadata: { sourceName: value.name, totalRows: parsed.length - 1, successRows, failedRows },
    },
  });

  revalidatePath("/app/settings/geography");
}
