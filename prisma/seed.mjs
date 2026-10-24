import { randomBytes, scryptSync } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required to bootstrap RentFlow.`);
  return value;
}

function hashPin(pin) {
  if (!/^\d{4}$/.test(pin)) throw new Error("BOOTSTRAP_ADMIN_PIN must contain exactly four digits.");
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(pin, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

function normalizePhone(value) {
  let phone = value.replace(/[^0-9+]/g, "").replace(/^\+/, "");
  if (/^0\d{9}$/.test(phone)) phone = `255${phone.slice(1)}`;
  if (/^\d{9}$/.test(phone)) phone = `255${phone}`;
  if (!/^255\d{9}$/.test(phone)) throw new Error("BOOTSTRAP_ADMIN_PHONE must be a valid Tanzanian phone number.");
  return phone;
}

async function main() {
  const organizationName = required("BOOTSTRAP_ORGANIZATION_NAME");
  const organizationSlug = required("BOOTSTRAP_ORGANIZATION_SLUG").toLowerCase();
  const adminName = required("BOOTSTRAP_ADMIN_NAME");
  const adminEmail = required("BOOTSTRAP_ADMIN_EMAIL").toLowerCase();
  const adminPhone = normalizePhone(required("BOOTSTRAP_ADMIN_PHONE"));
  const adminPin = required("BOOTSTRAP_ADMIN_PIN");

  const organization = await db.organization.upsert({
    where: { slug: organizationSlug },
    update: { name: organizationName, active: true },
    create: { name: organizationName, slug: organizationSlug, active: true },
  });

  const existing = await db.user.findUnique({ where: { email: adminEmail } });
  const user = existing
    ? await db.user.update({
        where: { id: existing.id },
        data: { name: adminName, phone: adminPhone, role: "LANDLORD", passwordHash: hashPin(adminPin) },
      })
    : await db.user.create({
        data: {
          name: adminName,
          email: adminEmail,
          phone: adminPhone,
          role: "LANDLORD",
          passwordHash: hashPin(adminPin),
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
      metadata: { adminEmail, adminPhone: `${adminPhone.slice(0, 5)}****${adminPhone.slice(-3)}` },
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
