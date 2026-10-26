import "server-only";

import { z } from "zod";

import { DEFAULT_ART_MODEL, getArtModel } from "@/config/image-model-catalog";
import { env } from "@/lib/env";
import { DefiniteArtFailure } from "./provider";

const MAX_OUTPUT_BYTES = 20 * 1024 * 1024;
const LEGACY_WANX_MODEL = "wanx2.1-imageedit";
export class UnknownArtTask extends Error {}
export class ArtProviderRateLimitError extends Error {}
export class ArtProviderUnavailableError extends DefiniteArtFailure {}
const QWEN_BASE = env.DASHSCOPE_WORKSPACE_ID
  ? `https://${env.DASHSCOPE_WORKSPACE_ID}.cn-beijing.maas.aliyuncs.com/api/v1`
  : "https://dashscope.aliyuncs.com/api/v1";

function providerFailure(response: Response): never {
  if (response.status === 429)
    throw new ArtProviderRateLimitError("Image provider is rate limited");
  if ([401, 403, 404].includes(response.status))
    throw new ArtProviderUnavailableError("Image provider is unavailable");
  if ([400, 413, 422].includes(response.status))
    throw new DefiniteArtFailure("Image provider rejected the request");
  throw new Error("Image provider submission outcome is uncertain");
}

function dashscopeKey() {
  if (!env.DASHSCOPE_API_KEY)
    throw new DefiniteArtFailure("DashScope API is not configured");
  return env.DASHSCOPE_API_KEY;
}

async function downloadDashscopeImage(
  url: string,
  modelName: "Qwen" | "Wanx",
): Promise<Buffer> {
  const imageUrl = new URL(url);
  if (
    imageUrl.protocol !== "https:" ||
    !/^dashscope-[a-z0-9]+(?:-[a-z0-9]+)*\.oss-[a-z0-9]+(?:-[a-z0-9]+)*\.aliyuncs\.com$/.test(
      imageUrl.hostname,
    )
  )
    throw new Error(`Unexpected ${modelName} result host`);
  const image = await fetch(imageUrl, {
    redirect: "error",
    signal: AbortSignal.timeout(30_000),
  });
  if (
    !image.ok ||
    Number(image.headers.get("content-length") ?? 0) > MAX_OUTPUT_BYTES
  )
    throw new Error(`${modelName} image download failed`);
  const bytes = Buffer.from(await image.arrayBuffer());
  if (bytes.length > MAX_OUTPUT_BYTES)
    throw new Error(`${modelName} image too large`);
  return bytes;
}

function arkKey() {
  if (!env.ARK_API_KEY)
    throw new DefiniteArtFailure("Seedream API is not configured");
  return env.ARK_API_KEY;
}

export async function submitQwen(
  input: Buffer,
  prompt: string,
  model: string = DEFAULT_ART_MODEL,
) {
  if (getArtModel(model)?.provider !== "qwen")
    throw new DefiniteArtFailure("Unsupported Qwen image model");
  const response = await fetch(
    `${QWEN_BASE}/services/aigc/image-generation/generation`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${dashscopeKey()}`,
        "Content-Type": "application/json",
        "X-DashScope-Async": "enable",
      },
      body: JSON.stringify({
        model,
        input: {
          messages: [
            {
              role: "user",
              content: [
                { image: `data:image/webp;base64,${input.toString("base64")}` },
                { text: prompt },
              ],
            },
          ],
        },
        parameters: {
          prompt_extend: false,
          ...(model === "qwen-image-3.0-pro" ? { enable_thinking: false } : {}),
          n: 1,
          watermark: false,
        },
      }),
      signal: AbortSignal.timeout(30_000),
    },
  );
  if (!response.ok) providerFailure(response);
  const parsed = z
    .object({ output: z.object({ task_id: z.string().min(1) }) })
    .safeParse(await response.json());
  if (!parsed.success)
    throw new Error("Qwen task acknowledgement was not understood");
  return parsed.data.output.task_id;
}

export async function pollQwen(
  requestId: string,
): Promise<{ done: false } | { done: true; bytes: Buffer }> {
  const response = await fetch(
    `${QWEN_BASE}/tasks/${encodeURIComponent(requestId)}`,
    {
      headers: { Authorization: `Bearer ${dashscopeKey()}` },
      signal: AbortSignal.timeout(30_000),
    },
  );
  if (response.status === 404)
    throw new UnknownArtTask("Qwen task is unavailable");
  if (!response.ok) throw new Error("Qwen task could not be checked");
  const parsed = z
    .object({
      output: z.object({
        task_status: z.enum([
          "PENDING",
          "RUNNING",
          "SUCCEEDED",
          "FAILED",
          "CANCELED",
          "UNKNOWN",
        ]),
        choices: z
          .array(
            z.object({
              message: z.object({
                content: z.array(z.object({ image: z.string() })),
              }),
            }),
          )
          .optional(),
      }),
    })
    .parse(await response.json());
  const status = parsed.output.task_status;
  if (status === "PENDING" || status === "RUNNING") return { done: false };
  if (status === "FAILED" || status === "CANCELED")
    throw new DefiniteArtFailure("Qwen could not complete the image edit");
  if (status === "UNKNOWN")
    throw new UnknownArtTask("Qwen task status is unknown");
  const url = parsed.output.choices?.[0]?.message.content[0]?.image;
  if (!url) throw new Error("Qwen result is missing an image");
  return { done: true, bytes: await downloadDashscopeImage(url, "Qwen") };
}

export async function submitWanx(
  input: Buffer,
  prompt: string,
  model: string,
): Promise<string> {
  const legacy = model === LEGACY_WANX_MODEL;
  if (!legacy && getArtModel(model)?.provider !== "wanx")
    throw new DefiniteArtFailure("Unsupported Wanx image model");
  const response = await fetch(
    `${QWEN_BASE}/services/aigc/${legacy ? "image2image/image-synthesis" : "image-generation/generation"}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${dashscopeKey()}`,
        "Content-Type": "application/json",
        "X-DashScope-Async": "enable",
      },
      body: JSON.stringify(
        legacy
          ? {
              model,
              input: {
                function: "description_edit",
                prompt,
                base_image_url: `data:image/webp;base64,${input.toString("base64")}`,
              },
              parameters: { n: 1, watermark: false },
            }
          : {
              model,
              input: {
                messages: [
                  {
                    role: "user",
                    content: [
                      {
                        image: `data:image/webp;base64,${input.toString("base64")}`,
                      },
                      { text: prompt },
                    ],
                  },
                ],
              },
              parameters: { size: "2K", n: 1, watermark: false },
            },
      ),
      signal: AbortSignal.timeout(30_000),
    },
  );
  if (!response.ok) providerFailure(response);
  const parsed = z
    .object({ output: z.object({ task_id: z.string().min(1) }) })
    .safeParse(await response.json());
  if (!parsed.success)
    throw new Error("Wanx task acknowledgement was not understood");
  return parsed.data.output.task_id;
}

export async function pollWanx(
  requestId: string,
): Promise<{ done: false } | { done: true; bytes: Buffer }> {
  const response = await fetch(
    `${QWEN_BASE}/tasks/${encodeURIComponent(requestId)}`,
    {
      headers: { Authorization: `Bearer ${dashscopeKey()}` },
      signal: AbortSignal.timeout(30_000),
    },
  );
  if (response.status === 404)
    throw new UnknownArtTask("Wanx task is unavailable");
  if (!response.ok) throw new Error("Wanx task could not be checked");
  const parsed = z
    .object({
      output: z.object({
        task_status: z.enum([
          "PENDING",
          "RUNNING",
          "SUCCEEDED",
          "FAILED",
          "CANCELED",
          "UNKNOWN",
        ]),
        results: z.array(z.object({ url: z.string().optional() })).optional(),
        choices: z
          .array(
            z.object({
              message: z.object({
                content: z.array(z.object({ image: z.string().optional() })),
              }),
            }),
          )
          .optional(),
      }),
    })
    .parse(await response.json());
  const status = parsed.output.task_status;
  if (status === "PENDING" || status === "RUNNING") return { done: false };
  if (status === "FAILED" || status === "CANCELED")
    throw new DefiniteArtFailure("Wanx could not complete the image edit");
  if (status === "UNKNOWN")
    throw new UnknownArtTask("Wanx task status is unknown");
  const url =
    parsed.output.results?.find((result) => result.url)?.url ??
    parsed.output.choices
      ?.flatMap((choice) => choice.message.content)
      .find((content) => content.image)?.image;
  if (!url) throw new Error("Wanx result is missing an image");
  return { done: true, bytes: await downloadDashscopeImage(url, "Wanx") };
}

export async function generateSeedream(
  input: Buffer,
  prompt: string,
  model: string,
): Promise<Buffer> {
  if (getArtModel(model)?.provider !== "seedream")
    throw new DefiniteArtFailure("Unsupported Seedream image model");
  const response = await fetch(
    "https://ark.cn-beijing.volces.com/api/v3/images/generations",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${arkKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt,
        image: `data:image/webp;base64,${input.toString("base64")}`,
        size: "1.5K",
        response_format: "b64_json",
        watermark: false,
      }),
      signal: AbortSignal.timeout(95_000),
    },
  );
  if (!response.ok) providerFailure(response);
  if (
    Number(response.headers.get("content-length") ?? 0) >
    MAX_OUTPUT_BYTES * 1.4
  )
    throw new Error("Seedream response too large");
  const body = await response.text();
  if (body.length > MAX_OUTPUT_BYTES * 1.4)
    throw new Error("Seedream response too large");
  const parsed = z
    .object({
      data: z.array(z.object({ b64_json: z.string().min(1) })).length(1),
    })
    .safeParse(JSON.parse(body));
  if (!parsed.success)
    throw new Error("Seedream response did not contain one image");
  const encoded = parsed.data.data[0].b64_json;
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded))
    throw new Error("Seedream returned invalid image data");
  const bytes = Buffer.from(encoded, "base64");
  if (!bytes.length || bytes.length > MAX_OUTPUT_BYTES)
    throw new Error("Seedream image size is invalid");
  return bytes;
}
