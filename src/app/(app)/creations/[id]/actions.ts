"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { artAssets, artJobs } from "@/db/schema";
import { requireSession } from "@/lib/auth/session";

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
  revalidatePath("/creations");
  redirect("/creations");
}
