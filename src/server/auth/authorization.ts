import type { Role } from "@prisma/client";

export const sectionPermissions: Record<Role, readonly string[]> = {
  PLATFORM_ADMIN: ["properties", "units", "listings", "tenants", "leases", "payments", "supervisors", "maintenance", "notices", "reports", "settings"],
  LANDLORD: ["properties", "units", "listings", "tenants", "leases", "payments", "supervisors", "maintenance", "notices", "reports", "settings"],
  PROPERTY_ADMIN: ["properties", "units", "listings", "tenants", "leases", "payments", "supervisors", "maintenance", "notices", "reports"],
  SUPERVISOR: ["units", "tenants", "maintenance", "notices"],
  TENANT: ["leases", "payments", "maintenance", "notices"],
};

const createPermissions: Record<Role, readonly string[]> = {
  PLATFORM_ADMIN: ["properties", "units", "listings", "tenants", "leases", "maintenance", "notices"],
  LANDLORD: ["properties", "units", "listings", "tenants", "leases", "maintenance", "notices"],
  PROPERTY_ADMIN: ["properties", "units", "listings", "tenants", "leases", "maintenance", "notices"],
  SUPERVISOR: ["maintenance", "notices"],
  TENANT: ["maintenance"],
};

export function canAccessSection(role: Role, section: string) {
  return sectionPermissions[role].includes(section);
}

export function canCreateSection(role: Role, section: string) {
  return createPermissions[role].includes(section);
}

export function canManagePortfolio(role: Role) {
  return role === "PLATFORM_ADMIN" || role === "LANDLORD" || role === "PROPERTY_ADMIN";
}
