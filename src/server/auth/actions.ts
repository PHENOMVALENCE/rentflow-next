"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db, hasDatabaseConfiguration } from "@/server/db";
import { normalizeTanzaniaPhone } from "./phone";
import { verifyPin } from "./password";
import { clearSession, createSession } from "./session";

const loginSchema = z.object({
  phone: z.string().trim().min(9).max(20),
  pin: z.string().regex(/^\d{4}$/),
});

export async function loginAction(formData: FormData) {
  if (!hasDatabaseConfiguration()) redirect("/app");

  const input = loginSchema.safeParse({
    phone: formData.get("phone"),
    pin: formData.get("pin"),
  });
  if (!input.success) redirect("/login?error=invalid");

  let phone: string;
  try {
    phone = normalizeTanzaniaPhone(input.data.phone);
  } catch {
    redirect("/login?error=invalid");
  }

  // Compatibility bridge: until the reviewed Prisma migration adds a dedicated pinHash
  // column, the existing credential hash column stores only the account PIN hash.
  const candidates = await db.user.findMany({
    where: { phone: { in: [phone, `+${phone}`, `0${phone.slice(3)}`] } },
    include: { memberships: { take: 1, orderBy: { createdAt: "asc" } } },
    take: 2,
  });
  const user = candidates.length === 1 ? candidates[0] : null;
  if (!user?.passwordHash || !verifyPin(input.data.pin, user.passwordHash)) {
    redirect("/login?error=invalid");
  }

  const membership = user.memberships[0];
  await createSession({
    userId: user.id,
    organizationId: membership?.organizationId ?? null,
    role: membership?.role ?? user.role,
  });

  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  redirect("/app");
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}
