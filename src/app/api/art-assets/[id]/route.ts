import { and, eq, isNull } from "drizzle-orm";
import { headers } from "next/headers";

import { db } from "@/db";
import { artAssets } from "@/db/schema";
import { auth } from "@/lib/auth";
import { readArtAsset } from "@/lib/art/storage";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new Response("Unauthorized", { status: 401 });
  const { id } = await context.params;
  const [asset] = await db
    .select()
    .from(artAssets)
    .where(
      and(
        eq(artAssets.id, id),
        eq(artAssets.userId, session.user.id),
        isNull(artAssets.deletedAt),
      ),
    )
    .limit(1);
  if (!asset || asset.expiresAt < new Date())
    return new Response("Not found", { status: 404 });
  try {
    const bytes = await readArtAsset(asset.storageKey);
    const download = new URL(request.url).searchParams.get("download") === "1";
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": asset.mediaType,
        "Content-Length": String(bytes.length),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="artora-${asset.kind}-${asset.id}.webp"`,
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
