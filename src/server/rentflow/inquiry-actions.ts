"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/server/auth/session";
import { db } from "@/server/db";

const statusSchema = z.enum(["NEW", "CONTACTED", "QUALIFIED", "CLOSED"]);

async function getScopedInquiry(id: string, organizationId: string | null) {
  return db.propertyInquiry.findFirst({
    where: {
      id,
      ...(organizationId
        ? {
            listingId: { not: null },
            AND: { listing: { unit: { property: { organizationId } } } },
          }
        : {}),
    },
  });
}

export async function updateInquiryStatus(formData: FormData) {
  const session = await requireSession(["PLATFORM_ADMIN", "LANDLORD", "PROPERTY_ADMIN"]);
  const inquiryId = z.string().min(1).parse(formData.get("inquiryId"));
  const status = statusSchema.parse(formData.get("status"));
  const inquiry = await getScopedInquiry(inquiryId, session.organizationId);
  if (!inquiry) throw new Error("Inquiry not found in your organization.");

  await db.$transaction(async (tx) => {
    await tx.propertyInquiry.update({ where: { id: inquiry.id }, data: { status } });
    await tx.auditLog.create({
      data: {
        organizationId: session.organizationId,
        actorId: session.userId,
        action: "inquiry.status_changed",
        resourceType: "PropertyInquiry",
        resourceId: inquiry.id,
        metadata: { from: inquiry.status, to: status },
      },
    });
  });

  revalidatePath("/app/inquiries");
  revalidatePath(`/app/inquiries/${inquiry.id}`);
}

export async function qualifyInquiryAsProspect(formData: FormData) {
  const session = await requireSession(["PLATFORM_ADMIN", "LANDLORD", "PROPERTY_ADMIN"]);
  if (!session.organizationId) throw new Error("An organization is required to qualify prospects.");
  const inquiryId = z.string().min(1).parse(formData.get("inquiryId"));
  const inquiry = await getScopedInquiry(inquiryId, session.organizationId);
  if (!inquiry) throw new Error("Inquiry not found in your organization.");

  if (inquiry.prospectId) {
    await db.propertyInquiry.update({ where: { id: inquiry.id }, data: { status: "QUALIFIED" } });
    revalidatePath("/app/inquiries");
    revalidatePath(`/app/inquiries/${inquiry.id}`);
    return;
  }

  await db.$transaction(async (tx) => {
    const prospect = await tx.prospect.create({
      data: {
        organizationId: session.organizationId!,
        name: inquiry.name,
        phone: inquiry.phone,
        email: inquiry.email,
        source: "PUBLIC_LISTING_INQUIRY",
        status: "QUALIFIED",
        notes: inquiry.message,
      },
    });

    await tx.propertyInquiry.update({
      where: { id: inquiry.id },
      data: { prospectId: prospect.id, status: "QUALIFIED" },
    });

    await tx.auditLog.create({
      data: {
        organizationId: session.organizationId,
        actorId: session.userId,
        action: "inquiry.qualified",
        resourceType: "PropertyInquiry",
        resourceId: inquiry.id,
        metadata: { prospectId: prospect.id },
      },
    });
  });

  revalidatePath("/app/inquiries");
  revalidatePath(`/app/inquiries/${inquiry.id}`);
}
