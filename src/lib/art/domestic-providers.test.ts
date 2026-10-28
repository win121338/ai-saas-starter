import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({
  env: {
    DASHSCOPE_API_KEY: "qwen-test-key",
    ARK_API_KEY: "ark-test-key",
    DASHSCOPE_WORKSPACE_ID: undefined,
  },
}));

import { DefiniteArtFailure } from "./provider";
import type { ReferenceInputOrder } from "@/lib/creative/image-inputs";
import {
  ArtProviderRateLimitError,
  ArtProviderUnavailableError,
  generateSeedream,
  pollQwen,
  pollWanx,
  submitQwen,
  submitWanx,
} from "./domestic-providers";

const photo = Buffer.from("private-photo");

beforeEach(() => {
  vi.unstubAllGlobals();
});

describe("domestic image providers", () => {
  it.each(
    [
      "qwen-image-2.1-turbo",
      "qwen-image-3.0-pro",
      "wan2.7-image",
      "wan2.7-image-pro",
      "doubao-seedream-5-0-flash-260915",
    ].flatMap((model) =>
      ([undefined, "subject-first", "reference-first"] as const).map(
        (order) => [model, order] as const,
      ),
    ),
  )(
    "sends image roles consistently to %s with order %s, and omits the reference when absent",
    async (model, order: ReferenceInputOrder | undefined) => {
      const fetchMock = vi.fn().mockImplementation(
        async () =>
          new Response(
            JSON.stringify({
              output: { task_id: "reference-task" },
              data: [{ b64_json: Buffer.from("result").toString("base64") }],
            }),
            { status: 200 },
          ),
      );
      vi.stubGlobal("fetch", fetchMock);
      const reference = Buffer.from("style-reference-not-the-user");
      const send = (ref?: Buffer) =>
        model.startsWith("qwen")
          ? submitQwen(
              photo,
              "roles and instructions",
              model,
              undefined,
              ref,
              order,
            )
          : model.startsWith("wan")
            ? submitWanx(
                photo,
                "roles and instructions",
                model,
                undefined,
                ref,
                order,
              )
            : generateSeedream(
                photo,
                "roles and instructions",
                model,
                undefined,
                ref,
                order,
              );
      const uri = (bytes: Buffer) =>
        `data:image/webp;base64,${bytes.toString("base64")}`;
      await send(reference);
      const first = JSON.parse(fetchMock.mock.calls[0][1].body);
      const expected =
        order === "subject-first"
          ? [uri(photo), uri(reference)]
          : [uri(reference), uri(photo)];
      if (model.startsWith("doubao")) expect(first.image).toEqual(expected);
      else
        expect(first.input.messages[0].content).toEqual([
          ...expected.map((image) => ({ image })),
          { text: "roles and instructions" },
        ]);
      await send();
      const second = JSON.parse(fetchMock.mock.calls[1][1].body);
      if (model.startsWith("doubao")) expect(second.image).toBe(uri(photo));
      else
        expect(second.input.messages[0].content).toEqual([
          { image: uri(photo) },
          { text: "roles and instructions" },
        ]);
    },
  );
  it("rejects a style reference for the archived single-image Wan model before a request", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      submitWanx(
        photo,
        "paint",
        "wanx2.1-imageedit",
        undefined,
        Buffer.from("reference"),
      ),
    ).rejects.toBeInstanceOf(DefiniteArtFailure);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it.each([
    [404, "ModelNotOpen", "provider_model_not_open"],
    [401, "AuthenticationError", "provider_authentication_failed"],
    [403, "AccessDenied", "provider_access_denied"],
    [404, "InvalidEndpointOrModel.NotFound", "provider_model_not_found"],
    [
      404,
      "InvalidEndpointOrModel.ModelIDAccessDisabled",
      "provider_access_denied",
    ],
    [403, "AccountOverdueError", "provider_account_unavailable"],
  ])(
    "classifies Seedream HTTP %s / %s without exposing raw provider messages",
    async (status, code, failureCode) => {
      const privateMessage = "private-photo-data-and-test-key";
      vi.stubGlobal(
        "fetch",
        vi
          .fn()
          .mockResolvedValue(
            new Response(
              JSON.stringify({ error: { code, message: privateMessage } }),
              { status: Number(status) },
            ),
          ),
      );
      const error = await generateSeedream(
        photo,
        "paint",
        "doubao-seedream-5-0-flash-260915",
      ).catch((error: unknown) => error);
      expect(error).toBeInstanceOf(ArtProviderUnavailableError);
      expect(error).toMatchObject({ failureCode });
      expect(String(error)).not.toContain(privateMessage);
    },
  );
  it("keeps generic handling for a non-JSON Seedream 404", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("not found", { status: 404 })),
    );
    await expect(
      generateSeedream(photo, "paint", "doubao-seedream-5-0-flash-260915"),
    ).rejects.toMatchObject({ failureCode: "provider_unavailable" });
  });
  it.each([
    "qwen-image-2.1-turbo",
    "qwen-image-3.0-pro",
    "wan2.7-image",
    "wan2.7-image-pro",
    "doubao-seedream-5-0-flash-260915",
  ])(
    "sends a saved portrait canvas to %s using its native size field",
    async (model) => {
      const fetchMock = vi.fn().mockImplementation(
        async () =>
          new Response(
            JSON.stringify({
              output: { task_id: "ratio-task" },
              data: [{ b64_json: Buffer.from("image").toString("base64") }],
            }),
            { status: 200 },
          ),
      );
      vi.stubGlobal("fetch", fetchMock);
      const canvas = { width: 4, height: 5 };
      if (model.startsWith("qwen"))
        await submitQwen(photo, "portrait", model, canvas);
      else if (model.startsWith("wan"))
        await submitWanx(photo, "portrait", model, canvas);
      else await generateSeedream(photo, "portrait", model, canvas);
      const body = JSON.parse(String(fetchMock.mock.calls[0][1].body));
      const size: string = model.startsWith("doubao")
        ? body.size
        : body.parameters.size;
      const [width, height] = size
        .split(model.startsWith("doubao") ? "x" : "*")
        .map(Number);
      expect(width / height).toBeCloseTo(4 / 5, 2);
      expect(width * height).toBeLessThanOrEqual(
        model.startsWith("doubao") ? 1536 ** 2 : 2048 ** 2,
      );
      expect(width * height).toBeGreaterThan(921600);
    },
  );
  it("submits a Qwen edit asynchronously with the private photo and saved model", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          output: { task_id: "task-1", task_status: "PENDING" },
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    expect(
      await submitQwen(
        photo,
        "Keep the face, paint in oils",
        "qwen-image-2.1-turbo",
      ),
    ).toBe("task-1");
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/api/v1/services/aigc/image-generation/generation");
    expect(init.headers).toMatchObject({ "X-DashScope-Async": "enable" });
    expect(JSON.parse(String(init.body))).toMatchObject({
      model: "qwen-image-2.1-turbo",
      input: {
        messages: [
          {
            content: [
              { image: `data:image/webp;base64,${photo.toString("base64")}` },
              { text: "Keep the face, paint in oils" },
            ],
          },
        ],
      },
      parameters: { prompt_extend: false, n: 1 },
    });
  });

  it("submits Qwen-Image 3.0 Pro as one asynchronous image edit without rewriting the style prompt", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ output: { task_id: "qwen-3-task" } }), {
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    expect(
      await submitQwen(photo, "Preserve the subject", "qwen-image-3.0-pro"),
    ).toBe("qwen-3-task");
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/services/aigc/image-generation/generation");
    expect(init.headers).toMatchObject({ "X-DashScope-Async": "enable" });
    expect(JSON.parse(String(init.body))).toMatchObject({
      model: "qwen-image-3.0-pro",
      input: {
        messages: [
          {
            content: [
              { image: `data:image/webp;base64,${photo.toString("base64")}` },
              { text: "Preserve the subject" },
            ],
          },
        ],
      },
      parameters: {
        prompt_extend: false,
        enable_thinking: false,
        n: 1,
        watermark: false,
      },
    });
  });

  it("polls Qwen and downloads only the official result host", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            output: {
              task_status: "SUCCEEDED",
              choices: [
                {
                  message: {
                    content: [
                      {
                        image:
                          "https://dashscope-result-sz.oss-cn-shenzhen.aliyuncs.com/one.png",
                      },
                    ],
                  },
                },
              ],
            },
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(Buffer.from("result"), { status: 200 }),
      );
    vi.stubGlobal("fetch", fetchMock);
    const result = await pollQwen("task-1");
    expect(result.done).toBe(true);
    if (result.done) expect(result.bytes.toString()).toBe("result");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("blocks an unexpected Qwen result host", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            output: {
              task_status: "SUCCEEDED",
              choices: [
                {
                  message: {
                    content: [{ image: "https://example.com/one.png" }],
                  },
                },
              ],
            },
          }),
          { status: 200 },
        ),
      ),
    );
    await expect(pollQwen("task-1")).rejects.toThrow(
      "Unexpected Qwen result host",
    );
  });

  it("treats a Qwen failed task as a definite failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            output: {
              task_status: "FAILED",
            },
          }),
          { status: 200 },
        ),
      ),
    );
    await expect(pollQwen("task-1")).rejects.toBeInstanceOf(DefiniteArtFailure);
  });

  it.each(["wan2.7-image-pro", "wan2.7-image"])(
    "submits %s through Wan 2.7 image editing",
    async (model) => {
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ output: { task_id: "wan-27-task" } }), {
          status: 200,
        }),
      );
      vi.stubGlobal("fetch", fetchMock);
      expect(await submitWanx(photo, "Paint this as watercolor", model)).toBe(
        "wan-27-task",
      );
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(
        "https://dashscope.aliyuncs.com/api/v1/services/aigc/image-generation/generation",
      );
      expect(init.headers).toMatchObject({
        Authorization: "Bearer qwen-test-key",
        "X-DashScope-Async": "enable",
      });
      expect(JSON.parse(String(init.body))).toEqual({
        model,
        input: {
          messages: [
            {
              role: "user",
              content: [
                { image: `data:image/webp;base64,${photo.toString("base64")}` },
                { text: "Paint this as watercolor" },
              ],
            },
          ],
        },
        parameters: { size: "2K", n: 1, watermark: false },
      });
    },
  );

  it("keeps the Wanx 2.1 request format for previously queued jobs", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ output: { task_id: "wanx-task-1" } }), {
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    expect(
      await submitWanx(photo, "Paint this as watercolor", "wanx2.1-imageedit"),
    ).toBe("wanx-task-1");
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://dashscope.aliyuncs.com/api/v1/services/aigc/image2image/image-synthesis",
    );
    expect(init.headers).toMatchObject({
      Authorization: "Bearer qwen-test-key",
      "X-DashScope-Async": "enable",
    });
    expect(JSON.parse(String(init.body))).toMatchObject({
      model: "wanx2.1-imageedit",
      input: {
        function: "description_edit",
        prompt: "Paint this as watercolor",
        base_image_url: `data:image/webp;base64,${photo.toString("base64")}`,
      },
      parameters: { n: 1 },
    });
  });

  it("polls a Wan 2.7 choice result and downloads its image", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            output: {
              task_status: "SUCCEEDED",
              choices: [
                {
                  message: {
                    content: [
                      {
                        image:
                          "https://dashscope-5859.oss-cn-wulanchabu-acdr-1.aliyuncs.com/new.png",
                      },
                    ],
                  },
                },
              ],
            },
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(Buffer.from("wan-27-image"), { status: 200 }),
      );
    vi.stubGlobal("fetch", fetchMock);
    const result = await pollWanx("wan-27-task");
    expect(result.done).toBe(true);
    if (result.done) expect(result.bytes.toString()).toBe("wan-27-image");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("polls Wanx, downloads its result, and rejects an unsafe host", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ output: { task_status: "RUNNING" } }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            output: {
              task_status: "SUCCEEDED",
              results: [
                {
                  url: "https://dashscope-5859.oss-cn-wulanchabu-acdr-1.aliyuncs.com/one.png",
                },
              ],
            },
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(Buffer.from("wanx-image"), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            output: {
              task_status: "SUCCEEDED",
              results: [
                {
                  url: "https://dashscope-5859.oss-cn-wulanchabu-acdr-1.aliyuncs.com.evil.test/private.png",
                },
              ],
            },
          }),
          { status: 200 },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);
    expect(await pollWanx("wanx-task-1")).toEqual({ done: false });
    const result = await pollWanx("wanx-task-1");
    expect(result.done).toBe(true);
    if (result.done) expect(result.bytes.toString()).toBe("wanx-image");
    await expect(pollWanx("wanx-task-2")).rejects.toThrow(
      "Unexpected Wanx result host",
    );
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("treats Wanx submission limit as retryable and rejects unknown model IDs", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response("rate limited", { status: 429 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      submitWanx(photo, "paint", "wan2.7-image"),
    ).rejects.toBeInstanceOf(ArtProviderRateLimitError);
    await expect(
      submitWanx(photo, "paint", "unlisted-wanx"),
    ).rejects.toBeInstanceOf(DefiniteArtFailure);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("submits one Seedream image edit and decodes its private result", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [{ b64_json: Buffer.from("result-image").toString("base64") }],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    expect(
      (
        await generateSeedream(
          photo,
          "Watercolor portrait",
          "doubao-seedream-5-0-flash-260915",
        )
      ).toString(),
    ).toBe("result-image");
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://ark.cn-beijing.volces.com/api/v3/images/generations",
    );
    expect(JSON.parse(String(init.body))).toMatchObject({
      model: "doubao-seedream-5-0-flash-260915",
      image: `data:image/webp;base64,${photo.toString("base64")}`,
      size: "1.5K",
      response_format: "b64_json",
    });
  });

  it("refuses arbitrary model IDs before making a paid request", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      generateSeedream(photo, "paint", "any-other-model"),
    ).rejects.toBeInstanceOf(DefiniteArtFailure);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
