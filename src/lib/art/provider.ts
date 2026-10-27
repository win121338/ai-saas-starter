import "server-only";

import sharp from "sharp";
import { ApiError, fal } from "@fal-ai/client";
import { z } from "zod";

import { env } from "@/lib/env";
import { getArtModel } from "@/config/image-model-catalog";
import type { ArtCanvas } from "@/config/art-aspect-ratios";

export const FAL_MODEL = "fal-ai/flux-pro/kontext";
export class DefiniteArtFailure extends Error {}

export function artProviderConfig(modelId: string) {
  if (env.ART_PROVIDER === "fal")
    return modelId === FAL_MODEL ? { provider: "fal", model: FAL_MODEL } : null;
  const selected = getArtModel(modelId);
  if (!selected) return null;
  if (env.ART_PROVIDER === "mock")
    return { provider: "mock", model: selected.id };
  if (
    ((selected.provider === "qwen" || selected.provider === "wanx") &&
      !env.DASHSCOPE_API_KEY) ||
    (selected.provider === "seedream" && !env.ARK_API_KEY)
  )
    return null;
  return { provider: selected.provider, model: selected.id };
}

export function artModelAvailable(modelId: string) {
  return artProviderConfig(modelId) !== null;
}

export async function makeMockArt(input: Buffer): Promise<Buffer> {
  const label = Buffer.from(
    '<svg width="700" height="100"><rect width="700" height="100" fill="#151a21" fill-opacity="0.85"/><text x="25" y="65" fill="white" font-size="38" font-family="sans-serif">LOCAL DEMO · NOT AI ART</text></svg>',
  );
  const metadata = await sharp(input).metadata();
  const overlay = await sharp(label)
    .resize({ width: Math.min(metadata.width ?? 700, 700) })
    .toBuffer();
  return sharp(input)
    .modulate({ saturation: 0.65 })
    .tint({ r: 225, g: 177, b: 138 })
    .composite([{ input: overlay, gravity: "southwest" }])
    .webp({ quality: 85 })
    .toBuffer();
}

function client() {
  if (!env.FAL_KEY) throw new Error("FAL_KEY is missing");
  fal.config({ credentials: env.FAL_KEY });
  return fal;
}

export async function submitFal(
  input: Buffer,
  prompt: string,
  canvas?: ArtCanvas,
): Promise<string> {
  try {
    const result = await client().queue.submit(FAL_MODEL, {
      input: {
        prompt,
        image_url: `data:image/webp;base64,${input.toString("base64")}`,
        ...(canvas ? { aspect_ratio: falCanvasRatio(canvas) } : {}),
      },
    });
    return result.request_id;
  } catch (error) {
    if (error instanceof ApiError && [400, 422].includes(error.status))
      throw new DefiniteArtFailure("Provider rejected the image or prompt");
    throw error;
  }
}

// Kontext exposes a fixed native list. Other common ratios are normalized
// to the saved user choice when persisting the result.
function falCanvasRatio(canvas: ArtCanvas) {
  const choices = [
    "21:9",
    "16:9",
    "4:3",
    "3:2",
    "1:1",
    "2:3",
    "3:4",
    "9:16",
    "9:21",
  ] as const;
  const ratio = canvas.width / canvas.height;
  return choices.reduce((best, next) => {
    const number = (value: string) => {
      const [w, h] = value.split(":").map(Number);
      return w / h;
    };
    return Math.abs(Math.log(number(next) / ratio)) <
      Math.abs(Math.log(number(best) / ratio))
      ? next
      : best;
  });
}

export async function pollFal(
  requestId: string,
): Promise<{ done: false } | { done: true; bytes: Buffer }> {
  const api = client();
  const status = await api.queue.status(FAL_MODEL, { requestId });
  if (status.status !== "COMPLETED") return { done: false };
  let result;
  try {
    result = await api.queue.result(FAL_MODEL, { requestId });
  } catch (error) {
    if (error instanceof ApiError && [400, 422].includes(error.status))
      throw new DefiniteArtFailure("Provider could not complete the edit");
    throw error;
  }
  const payload = z
    .object({ images: z.array(z.object({ url: z.url() })).min(1) })
    .parse(result.data);
  const imageUrl = new URL(payload.images[0].url);
  if (
    imageUrl.protocol !== "https:" ||
    !/(^|\.)fal\.media$/.test(imageUrl.hostname)
  ) {
    throw new Error("Unexpected provider image host");
  }
  const response = await fetch(imageUrl, {
    redirect: "error",
    signal: AbortSignal.timeout(30_000),
  });
  if (
    !response.ok ||
    Number(response.headers.get("content-length") ?? 0) > 20 * 1024 * 1024
  )
    throw new Error("Provider image download failed");
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > 20 * 1024 * 1024)
    throw new Error("Provider image too large");
  return { done: true, bytes };
}
