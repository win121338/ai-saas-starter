import "server-only";

import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db";
import { adminMembers } from "@/db/schema";
import { requireSession } from "@/lib/auth/session";
import { env } from "@/lib/env";

export function isBootstrapOwner(userId: string): boolean {
  return (
    Boolean(env.ADMIN_BOOTSTRAP_USER_ID) &&
    userId === env.ADMIN_BOOTSTRAP_USER_ID
  );
}

export async function isAdminUser(userId: string): Promise<boolean> {
  if (isBootstrapOwner(userId)) return true;
  const [member] = await db
    .select({ role: adminMembers.role })
    .from(adminMembers)
    .where(eq(adminMembers.userId, userId))
    .limit(1);
  return member?.role === "admin";
}

export async function requireAdmin() {
  const session = await requireSession();
  if (!(await isAdminUser(session.user.id))) notFound();
  return session;
}
