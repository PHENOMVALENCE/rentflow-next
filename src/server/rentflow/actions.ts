"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db, hasDatabaseConfiguration } from "@/server/db";

const inquirySchema = z.object({
  listingId: z.string().min(1),
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(9).max(30),
  email: z.string().trim().email().optional().or(z.literal("")),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
});

export async function submitPropertyInquiry(formData: FormData) {
  const input = inquirySchema.parse({
    listingId: formData.get("listingId"),
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    message: formData.get("message"),
  });

  if (!hasDatabaseConfiguration()) {
    redirect(`/listings/${input.listingId}?enquiry=unavailable#enquire`);
  }

  const listing = await db.propertyListing.findUnique({ where: { id: input.listingId } });
  if (!listing || listing.status !== "PUBLISHED") {
    throw new Error("This listing is not currently accepting inquiries.");
  }

  await db.propertyInquiry.create({
    data: {
      listingId: input.listingId,
      name: input.name,
      phone: input.phone,
      email: input.email || null,
      message: input.message || null,
    },
  });

  await db.auditLog.create({
    data: {
      action: "listing.inquiry_created",
      resourceType: "PropertyListing",
      resourceId: input.listingId,
      metadata: { channel: "PUBLIC_WEB" },
    },
  });

  redirect(`/listings/${input.listingId}?enquiry=sent#enquire`);
}
