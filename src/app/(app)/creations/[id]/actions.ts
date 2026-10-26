"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/db";
import { artAssets, artJobs } from "@/db/schema";
import { requireSession } from "@/lib/auth/session";
import { processOneArtJob } from "@/lib/art/jobs";
import { env } from "@/lib/env";
import { getLocale } from "@/lib/i18n-server";
import { localizedHref } from "@/lib/i18n";

export async function checkArtJobAction(id: string) {
  const user = (await requireSession()).user;
  const parsed = z.uuid().safeParse(id);
  if (!parsed.success || env.NODE_ENV !== "development") return;
  const [job] = await db
    .select({ status: artJobs.status })
    .from(artJobs)
    .where(
      and(
        eq(artJobs.id, parsed.data),
        eq(artJobs.userId, user.id),
        isNull(artJobs.deletedAt),
      ),
    )
    .limit(1);
  if (!job || !["queued", "processing"].includes(job.status)) return;
  await processOneArtJob(parsed.data);
}

export async function deleteArtJobAction(formData: FormData) {
  const user = (await requireSession()).user;
  const id = formData.get("id");
  if (typeof id !== "string") return;
  const [job] = await db
    .select()
    .from(artJobs)
    .where(
      and(
        eq(artJobs.id, id),
        eq(artJobs.userId, user.id),
        isNull(artJobs.deletedAt),
      ),
    )
    .limit(1);
  if (!job || !["completed", "failed"].includes(job.status)) return;
  await db.transaction(async (tx) => {
    await tx
      .update(artJobs)
      .set({ deletedAt: new Date() })
      .where(eq(artJobs.id, id));
    await tx
      .update(artAssets)
      .set({ expiresAt: new Date() })
      .where(eq(artAssets.id, job.inputAssetId));
    if (job.outputAssetId)
      await tx
        .update(artAssets)
        .set({ expiresAt: new Date() })
        .where(eq(artAssets.id, job.outputAssetId));
  });
  const path = localizedHref("/creations", await getLocale());
  revalidatePath("/creations");
  revalidatePath("/zh/creations");
  redirect(path);
}
