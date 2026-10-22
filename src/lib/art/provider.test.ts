import { beforeEach, describe, expect, it, vi } from "vitest";

const fake = vi.hoisted(() => ({
  config: vi.fn(),
  submit: vi.fn(),
  status: vi.fn(),
  result: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({ env: { FAL_KEY: "test-key" } }));
vi.mock("@fal-ai/client", () => ({
  ApiError: class extends Error {},
  fal: {
    config: fake.config,
    queue: { submit: fake.submit, status: fake.status, result: fake.result },
  },
}));

import { FAL_MODEL, pollFal, submitFal } from "./provider";

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("fal Kontext adapter", () => {
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
