"use server";

import { redirect } from "next/navigation";
import { requireSession } from "@/server/auth/session";
import { db } from "@/server/db";
import { tenantOnboardingSchema as schema, type TenantOnboardingPayload } from "./tenant-onboarding-notes";

export async function saveOwnTenantProfile(formData: FormData) {
  const session = await requireSession(["TENANT"]);
  const input = schema.parse({
    occupancyKind: formData.get("occupancyKind"),
    householdSafetyAttribute: formData.get("householdSafetyAttribute") || "",
    adultsCount: formData.get("adultsCount") || undefined,
    childrenCount: formData.get("childrenCount") || undefined,
    emergencyContactName: formData.get("emergencyContactName") || "",
    emergencyContactPhone: formData.get("emergencyContactPhone") || "",
    nextOfKinName: formData.get("nextOfKinName") || "",
    nextOfKinPhone: formData.get("nextOfKinPhone") || "",
    parkingNote: formData.get("parkingNote") || "",
    petsNote: formData.get("petsNote") || "",
    businessName: formData.get("businessName") || "",
    businessCategory: formData.get("businessCategory") || "",
    representativeName: formData.get("representativeName") || "",
    representativePhone: formData.get("representativePhone") || "",
    tin: formData.get("tin") || "",
    permittedActivity: formData.get("permittedActivity") || "",
  });

  const tenant = await db.tenant.findFirst({ where: { userId: session.userId, ...(session.organizationId ? { organizationId: session.organizationId } : {}) } });
  if (!tenant) redirect("/app?error=tenant-profile-missing");

  const residential = input.occupancyKind === "RESIDENTIAL";
  const payload: TenantOnboardingPayload = residential ? {
    ...input,
    businessName: "", businessCategory: "", representativeName: "", representativePhone: "", tin: "", permittedActivity: "",
  } : {
    ...input,
    adultsCount: undefined, childrenCount: undefined, emergencyContactName: "", emergencyContactPhone: "", nextOfKinName: "", nextOfKinPhone: "", parkingNote: "", petsNote: "",
  };

  const householdSize = residential ? Math.max(1, (input.adultsCount ?? 0) + (input.childrenCount ?? 0)) : null;
  await db.$transaction(async (tx) => {
    await tx.tenantProfile.upsert({
      where: { tenantId: tenant.id },
      create: { tenantId: tenant.id, emergencyName: residential ? input.emergencyContactName || null : null, emergencyPhone: residential ? input.emergencyContactPhone || null : null, householdSize, notes: `ONBOARDING_JSON:${JSON.stringify(payload)}` },
      update: { emergencyName: residential ? input.emergencyContactName || null : null, emergencyPhone: residential ? input.emergencyContactPhone || null : null, householdSize, notes: `ONBOARDING_JSON:${JSON.stringify(payload)}` },
    });
    await tx.auditLog.create({ data: { organizationId: tenant.organizationId, actorId: session.userId, action: "tenant.onboarding_profile_completed", resourceType: "Tenant", resourceId: tenant.id, metadata: { occupancyKind: input.occupancyKind, householdSafetyAttribute: input.householdSafetyAttribute || null } } });
  });
  redirect("/app/onboarding/lease");
}
