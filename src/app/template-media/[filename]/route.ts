import { z } from "zod";
import { readCreativeMedia } from "@/lib/creative/media";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;
  const id = z
    .uuid()
    .safeParse(filename.endsWith(".webp") ? filename.slice(0, -5) : "");
  if (!id.success) return new Response(null, { status: 404 });
  const bytes = await readCreativeMedia(id.data);
  if (!bytes) return new Response(null, { status: 404 });
  return new Response(bytes, {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
