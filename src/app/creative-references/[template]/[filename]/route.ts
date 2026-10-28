import { requireAdmin } from "@/lib/admin/auth";
import { readStyleReference } from "@/lib/creative/references";
import { listCreativeTemplates } from "@/lib/creative/catalog";
import { readCreativeMedia } from "@/lib/creative/media";
import { z } from "zod";

function imageResponse(bytes: Uint8Array) {
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ template: string; filename: string }>;
  },
) {
  await requireAdmin();
  const { template, filename } = await params;
  if (template === "uploads") {
    const id = z
      .uuid()
      .safeParse(filename.endsWith(".webp") ? filename.slice(0, -5) : "");
    if (!id.success) return new Response(null, { status: 404 });
    const bytes = await readCreativeMedia(id.data);
    return bytes ? imageResponse(bytes) : new Response(null, { status: 404 });
  }
  const src = `/creative-references/${template}/${filename}`;
  const reference = (await listCreativeTemplates())
    .flatMap((row) => [
      row.draft.recipe.referenceImage,
      row.published?.recipe.referenceImage,
    ])
    .find((image) => image?.src === src);
  if (!reference || reference.src !== src)
    return new Response(null, { status: 404 });
  try {
    return imageResponse(await readStyleReference(reference));
  } catch {
    return new Response(null, { status: 404 });
  }
}
