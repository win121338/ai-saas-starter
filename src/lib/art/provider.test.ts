import { beforeEach, describe, expect, it, vi } from "vitest";

const fake = vi.hoisted(() => ({
  config: vi.fn(),
  submit: vi.fn(),
  status: vi.fn(),
  result: vi.fn(),
  env: {
    FAL_KEY: "test-key",
    ART_PROVIDER: "live",
    DASHSCOPE_API_KEY: "qwen-test-key",
    ARK_API_KEY: "ark-test-key",
  } as {
    FAL_KEY: string;
    ART_PROVIDER: string;
    DASHSCOPE_API_KEY?: string;
    ARK_API_KEY?: string;
  },
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({ env: fake.env }));
vi.mock("@fal-ai/client", () => ({
  ApiError: class extends Error {},
  fal: {
    config: fake.config,
    queue: { submit: fake.submit, status: fake.status, result: fake.result },
  },
}));

import { FAL_MODEL, artProviderConfig, pollFal, submitFal } from "./provider";

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  fake.env.ART_PROVIDER = "live";
  fake.env.DASHSCOPE_API_KEY = "qwen-test-key";
  fake.env.ARK_API_KEY = "ark-test-key";
});

describe("fal Kontext adapter", () => {
  it("selects a native canvas nearest to the saved user ratio", async () => {
    fake.submit.mockResolvedValue({ request_id: "ratio-test" });
    await submitFal(Buffer.from("photo"), "portrait", { width: 4, height: 5 });
    expect(fake.submit).toHaveBeenCalledWith(FAL_MODEL, {
      input: expect.objectContaining({ aspect_ratio: "3:4" }),
    });
    await submitFal(Buffer.from("photo"), "landscape", {
      width: 16,
      height: 9,
    });
    expect(fake.submit).toHaveBeenLastCalledWith(FAL_MODEL, {
      input: expect.objectContaining({ aspect_ratio: "16:9" }),
    });
  });
  it("submits the private image as a data URI to the image-to-image endpoint", async () => {
    fake.submit.mockResolvedValue({ request_id: "req-1" });
    const requestId = await submitFal(Buffer.from("photo"), "Paint this");
    expect(requestId).toBe("req-1");
    expect(fake.config).toHaveBeenCalledWith({ credentials: "test-key" });
    expect(fake.submit).toHaveBeenCalledWith(FAL_MODEL, {
      input: {
        prompt: "Paint this",
        image_url: `data:image/webp;base64,${Buffer.from("photo").toString("base64")}`,
      },
    });
  });

  it("polls a saved request and downloads an allowed result", async () => {
    fake.status.mockResolvedValue({ status: "COMPLETED" });
    fake.result.mockResolvedValue({
      data: { images: [{ url: "https://v3.fal.media/files/test/result.jpg" }] },
    });
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(Buffer.from("result"), { status: 200 }),
        ),
    );
    const result = await pollFal("req-1");
    expect(result.done).toBe(true);
    if (result.done) expect(result.bytes.toString()).toBe("result");
    expect(fake.status).toHaveBeenCalledWith(FAL_MODEL, { requestId: "req-1" });
    expect(fake.result).toHaveBeenCalledWith(FAL_MODEL, { requestId: "req-1" });
  });

  it("rejects an unexpected provider result host", async () => {
    fake.status.mockResolvedValue({ status: "COMPLETED" });
    fake.result.mockResolvedValue({
      data: { images: [{ url: "https://example.com/private.jpg" }] },
    });
    await expect(pollFal("req-2")).rejects.toThrow(
      "Unexpected provider image host",
    );
  });
});

describe("model selection", () => {
  it("maps only listed models to configured providers", () => {
    expect(artProviderConfig("qwen-image-2.1-turbo")).toEqual({
      provider: "qwen",
      model: "qwen-image-2.1-turbo",
    });
    expect(artProviderConfig("doubao-seedream-5-0-flash-260915")).toEqual({
      provider: "seedream",
      model: "doubao-seedream-5-0-flash-260915",
    });
    expect(artProviderConfig("qwen-image-3.0-pro")).toEqual({
      provider: "qwen",
      model: "qwen-image-3.0-pro",
    });
    expect(artProviderConfig("wan2.7-image-pro")).toEqual({
      provider: "wanx",
      model: "wan2.7-image-pro",
    });
    expect(artProviderConfig("wan2.7-image")).toEqual({
      provider: "wanx",
      model: "wan2.7-image",
    });
    expect(artProviderConfig("wanx2.1-imageedit")).toBeNull();
    expect(artProviderConfig("arbitrary-model")).toBeNull();
  });

  it("does not offer an unconfigured provider", () => {
    fake.env.ARK_API_KEY = undefined;
    expect(artProviderConfig("doubao-seedream-5-0-flash-260915")).toBeNull();
    expect(artProviderConfig("qwen-image-2.1-turbo")?.provider).toBe("qwen");
    expect(artProviderConfig("wan2.7-image-pro")?.provider).toBe("wanx");
    fake.env.DASHSCOPE_API_KEY = undefined;
    expect(artProviderConfig("wan2.7-image-pro")).toBeNull();
    expect(artProviderConfig("qwen-image-3.0-pro")).toBeNull();
  });

  it("keeps the legacy fal mode tied to its own model ID", () => {
    fake.env.ART_PROVIDER = "fal";
    expect(artProviderConfig(FAL_MODEL)).toEqual({
      provider: "fal",
      model: FAL_MODEL,
    });
    expect(artProviderConfig("qwen-image-2.1-turbo")).toBeNull();
  });
});
