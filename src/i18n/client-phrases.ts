import { navigationFor, ROLE_LABELS, type NavRole } from "../lib/navigation";
import { PROPERTY_TYPE_LABELS, SORT_LABELS, UNIT_TYPE_LABELS } from "../lib/listing-filters";
import { EXTRACTED_CLIENT_PHRASES } from "./client-phrases.generated";

/** Phrases client components translate: literals found by the extractor plus labels passed in as data. */
export function clientPhrases(): string[] {
  const roles = Object.keys(ROLE_LABELS) as NavRole[];
  const nav = roles.flatMap((role) => [false, true].flatMap((inOrganization) => navigationFor(role, { inOrganization }))).flatMap((group) => [group.group ?? "", ...group.items.flatMap((item) => [item.label, item.hint])]);
  return [
    ...new Set([
      ...EXTRACTED_CLIENT_PHRASES,
      ...nav,
      ...Object.values(ROLE_LABELS),
      ...Object.values(UNIT_TYPE_LABELS),
      ...Object.values(PROPERTY_TYPE_LABELS),
      ...Object.values(SORT_LABELS),
      "Apartments",
      "Shops",
      "Offices",
    ]),
  ].filter(Boolean);
}
