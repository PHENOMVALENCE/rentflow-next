import { z } from "zod";

// Shared, non-action helpers: a "use server" module may only export async actions.
export const tenantOnboardingSchema = z.object({
  occupancyKind: z.enum(["RESIDENTIAL", "COMMERCIAL"]),
  householdSafetyAttribute: z.string().trim().max(80).optional().or(z.literal("")),
  adultsCount: z.coerce.number().int().min(0).max(30).optional(),
  childrenCount: z.coerce.number().int().min(0).max(30).optional(),
  emergencyContactName: z.string().trim().max(255).optional().or(z.literal("")),
  emergencyContactPhone: z.string().trim().max(32).optional().or(z.literal("")),
  nextOfKinName: z.string().trim().max(255).optional().or(z.literal("")),
  nextOfKinPhone: z.string().trim().max(32).optional().or(z.literal("")),
  parkingNote: z.string().trim().max(255).optional().or(z.literal("")),
  petsNote: z.string().trim().max(255).optional().or(z.literal("")),
  businessName: z.string().trim().max(255).optional().or(z.literal("")),
  businessCategory: z.string().trim().max(255).optional().or(z.literal("")),
  representativeName: z.string().trim().max(255).optional().or(z.literal("")),
  representativePhone: z.string().trim().max(32).optional().or(z.literal("")),
  tin: z.string().trim().max(32).optional().or(z.literal("")),
  permittedActivity: z.string().trim().max(255).optional().or(z.literal("")),
});

export type TenantOnboardingPayload = z.infer<typeof tenantOnboardingSchema>;

export function parseOnboardingNotes(notes: string | null): Partial<TenantOnboardingPayload> {
  if (!notes?.startsWith("ONBOARDING_JSON:")) return {};
  try { return JSON.parse(notes.slice("ONBOARDING_JSON:".length)) as Partial<TenantOnboardingPayload>; } catch { return {}; }
}
