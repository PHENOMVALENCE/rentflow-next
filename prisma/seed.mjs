import { randomBytes, scryptSync } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required to bootstrap RentFlow.`);
  return value;
}

function hashPassword(password) {
  if (password.length < 12) throw new Error("BOOTSTRAP_ADMIN_PASSWORD must be at least 12 characters.");
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

async function main() {
  const organizationName = required("BOOTSTRAP_ORGANIZATION_NAME");
  const organizationSlug = required("BOOTSTRAP_ORGANIZATION_SLUG").toLowerCase();
  const adminName = required("BOOTSTRAP_ADMIN_NAME");
  const adminEmail = required("BOOTSTRAP_ADMIN_EMAIL").toLowerCase();
  const adminPassword = required("BOOTSTRAP_ADMIN_PASSWORD");

  const organization = await db.organization.upsert({
    where: { slug: organizationSlug },
    update: { name: organizationName, active: true },
    create: { name: organizationName, slug: organizationSlug, active: true },
  });

  const existing = await db.user.findUnique({ where: { email: adminEmail } });
  const user = existing
    ? await db.user.update({
        where: { id: existing.id },
        data: { name: adminName, role: "LANDLORD" },
      })
    : await db.user.create({
        data: {
          name: adminName,
          email: adminEmail,
          role: "LANDLORD",
          passwordHash: hashPassword(adminPassword),
          preferredLanguage: "sw",
        },
      });

  await db.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: organization.id, userId: user.id } },
    update: { role: "LANDLORD" },
    create: { organizationId: organization.id, userId: user.id, role: "LANDLORD" },
  });

  await db.paymentProvider.upsert({
    where: { code: "SNIPPE" },
    update: { name: "Snippe" },
    create: { code: "SNIPPE", name: "Snippe", enabled: false },
  });

  await db.auditLog.create({
    data: {
      organizationId: organization.id,
      actorId: user.id,
      action: "system.bootstrap_seed",
      resourceType: "Organization",
      resourceId: organization.id,
      metadata: { adminEmail },
    },
  });

  console.log(`RentFlow bootstrap complete for ${organization.slug}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
