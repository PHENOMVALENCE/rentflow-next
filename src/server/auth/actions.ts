"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db, hasDatabaseConfiguration } from "@/server/db";
import { verifyPassword } from "./password";
import { clearSession, createSession } from "./session";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(200),
});

export async function loginAction(formData: FormData) {
  if (!hasDatabaseConfiguration()) redirect("/app");

  const input = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!input.success) redirect("/login?error=invalid");

  const user = await db.user.findUnique({
    where: { email: input.data.email.toLowerCase() },
    include: { memberships: { take: 1, orderBy: { createdAt: "asc" } } },
  });
  if (!user?.passwordHash || !verifyPassword(input.data.password, user.passwordHash)) {
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
