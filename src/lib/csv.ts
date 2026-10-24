/**
 * RFC 4180 CSV with spreadsheet formula-injection protection: cells starting with
 * = + - @ (or tab/carriage return) are prefixed with an apostrophe so Excel/Sheets treat them as text.
 */
export type CsvCell = string | number | null | undefined;

function cell(value: CsvCell) {
  if (value === null || value === undefined) return "";
  let text = String(value);
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(columns: string[], rows: CsvCell[][]) {
  return [columns, ...rows].map((row) => row.map(cell).join(",")).join("\r\n") + "\r\n";
}
