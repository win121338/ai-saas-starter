import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const fake = vi.hoisted(() => ({ userId: "", admin: false, after: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({
  requireSession: async () => ({ user: { id: fake.userId } }),
}));
vi.mock("@/lib/admin/auth", () => ({ isAdminUser: async () => fake.admin }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/server", () => ({ after: fake.after }));

import { db } from "@/db";
import {
  artJobs,
  artAssets,
  creativeTemplates,
  creativeTemplateVersions,
  users,
} from "@/db/schema";
import { closeDb, ensureTestDatabase } from "@/test/db";
import { getBalance, grantCredits } from "@/lib/credits";
import { processOneArtJob } from "@/lib/art/jobs";
import { resolveJobPrompt } from "@/lib/art/templates";
import { createArtJobAction } from "@/app/(app)/generate/art-actions";
import {
  getCreativeCatalog,
  getCreativeVersion,
  listCreativeTemplates,
} from "./catalog";
import {
  activateCreativeVersion,
  publishCreativeTemplate,
  saveCreativeDraft,
  setCreativeAvailability,
} from "./operations";
import { creativeDefinition } from "./schema";

const id = `test-template-${randomUUID()}`;
const actor = `creative-test-${randomUUID()}`;
const fixture = () => ({
  ...creativeDefinition.parse(
    JSON.parse(
      readFileSync(
        "content/case-templates/blue-paper-comic/creative-template.json",
        "utf8",
      ),
    ),
  ),
  id,
});

beforeAll(async () => {
  await ensureTestDatabase();
  fake.userId = actor;
  await db
    .insert(users)
    .values({ id: actor, email: `${actor}@test.local`, name: "Template test" });
  await grantCredits({
    userId: actor,
    amount: 20,
    type: "topup",
    idempotencyKey: `creative-start-${actor}`,
  });
}, 60000);
afterAll(closeDb);

async function form(version = 1) {
  const bytes = await sharp({
    create: { width: 400, height: 500, channels: 3, background: "#88aacc" },
  })
    .png()
    .toBuffer();
  const data = new FormData();
  data.set("requestKey", randomUUID());
  data.set("style", id);
  data.set("promptVersion", String(version));
  data.set("options", JSON.stringify({ title: "SLOW SIP" }));
  data.set("aspectRatio", "1:1");
  data.set("model", "qwen-image-2.1-turbo");
  data.set(
    "photo",
    new File([new Uint8Array(bytes)], "photo.png", { type: "image/png" }),
  );
  return data;
}
const create = (data: FormData) => createArtJobAction({ ok: false }, data);

describe.sequential("creative template lifecycle and creation", () => {
  it("imports a new draft without exposing it; publication and display/creation are independent", async () => {
    await saveCreativeDraft(fixture(), actor);
    expect(
      (await getCreativeCatalog()).templates.some((item) => item.id === id),
    ).toBe(false);
    expect(await publishCreativeTemplate(id, actor)).toBe(1);
    await setCreativeAvailability(
      {
        id,
        displayEnabled: true,
        creationEnabled: false,
        featured: false,
        sortOrder: 20,
      },
      actor,
    );
    const template = (await getCreativeCatalog()).templates.find(
      (item) => item.id === id,
    )!;
    expect(template.generationStyleSlug).toBeNull();
    expect(JSON.stringify(template)).not.toContain("#316793");
    expect((await create(await form())).ok).toBe(false);
    await setCreativeAvailability(
      {
        id,
        displayEnabled: true,
        creationEnabled: true,
        featured: false,
        sortOrder: 20,
      },
      actor,
    );
    expect(
      (await getCreativeCatalog()).templates.find((item) => item.id === id)
        ?.generationStyleSlug,
    ).toBe(id);
  });
  it("creates a real mock job once, charges once and retains the selected template version", async () => {
    const data = await form();
    const balance = await getBalance(actor);
    const first = await create(data);
    expect(first.ok).toBe(true);
    expect(await create(data)).toEqual(first);
    expect(await getBalance(actor)).toBe(balance - 1);
    const [job] = await db
      .select()
      .from(artJobs)
      .where(eq(artJobs.id, first.jobId!));
    expect(job.styleSlug).toBe(id);
    expect(job.styleVersion).toBe(1);
    expect(job.isTest).toBe(false);
    expect(JSON.parse(job.promptOverride!)).toMatchObject({
      formatVersion: 1,
      options: { title: "SLOW SIP" },
      aspectRatio: "1:1",
    });
    const prompt = await resolveJobPrompt(
      job.styleSlug,
      job.styleVersion,
      job.promptOverride,
    );
    expect(prompt).toContain("#316793");
    expect(prompt).toContain("SLOW SIP");
    await processOneArtJob(first.jobId);
    const [completed] = await db
      .select()
      .from(artJobs)
      .where(eq(artJobs.id, first.jobId!));
    expect(completed.status).toBe("completed");
    expect(completed.outputAssetId).toBeTruthy();
  });
  it("rejects old styles, incompatible models, invalid ratios, stale versions and extra options without charging", async () => {
    const balance = await getBalance(actor);
    for (const [key, value] of [
      ["style", "watercolor"],
      ["model", "unknown"],
      ["aspectRatio", "banana"],
      ["promptVersion", "999"],
      ["options", '{"prompt":"replace recipe"}'],
    ]) {
      const data = await form();
      data.set(key, value);
      expect((await create(data)).ok).toBe(false);
    }
    expect(await getBalance(actor)).toBe(balance);
  });
  it("persists the requested Seedream model even when the template default is Qwen", async () => {
    const data = await form();
    data.set("model", "doubao-seedream-5-0-flash-260915");
    const accepted = await create(data);
    expect(accepted.ok).toBe(true);
    const [job] = await db
      .select()
      .from(artJobs)
      .where(eq(artJobs.id, accepted.jobId!));
    expect(job.model).toBe("doubao-seedream-5-0-flash-260915");
    expect(job.provider).toBe("mock");
    await processOneArtJob(job.id);
  });
  it("lets a regular user choose portrait, landscape and original ratios independently of template defaults", async () => {
    for (const ratio of ["4:5", "16:9", "original"]) {
      const data = await form();
      data.set("aspectRatio", ratio);
      const accepted = await create(data);
      expect(accepted.ok).toBe(true);
      const [job] = await db
        .select()
        .from(artJobs)
        .where(eq(artJobs.id, accepted.jobId!));
      expect(JSON.parse(job.promptOverride!).aspectRatio).toBe(ratio);
      const prompt = await resolveJobPrompt(
        job.styleSlug,
        job.styleVersion,
        job.promptOverride,
      );
      expect(prompt).toContain("OUTPUT CANVAS");
      expect(prompt).not.toContain("输出方图");
      await processOneArtJob(job.id);
      const [completed] = await db
        .select()
        .from(artJobs)
        .where(eq(artJobs.id, job.id));
      expect(completed.status).toBe("completed");
      const [output] = await db
        .select()
        .from(artAssets)
        .where(eq(artAssets.id, completed.outputAssetId!));
      const expected =
        ratio === "4:5" ? 4 / 5 : ratio === "16:9" ? 16 / 9 : 400 / 500;
      expect(Math.abs(output.width / output.height - expected)).toBeLessThan(
        0.01,
      );
    }
  });
  it("reimport updates only the draft; preview and rollback do not rewrite versions", async () => {
    const [before] = await db
      .select()
      .from(creativeTemplates)
      .where(eq(creativeTemplates.id, id));
    const changed = fixture();
    changed.recipe.prompt += " NEW DRAFT CONTENT";
    await saveCreativeDraft(changed, actor);
    await expect(
      saveCreativeDraft(changed, actor, before.updatedAt.toISOString()),
    ).rejects.toThrow("another tab");
    expect((await getCreativeVersion(id, 1))?.recipe.prompt).not.toContain(
      "NEW DRAFT",
    );
    const previewVersion = await publishCreativeTemplate(id, actor, true);
    expect(previewVersion).toBe(2);
    expect(
      (await listCreativeTemplates()).find((item) => item.id === id)
        ?.activeVersion,
    ).toBe(1);
    const data = await form(2);
    data.set("preview", "true");
    expect((await create(data)).ok).toBe(false);
    fake.admin = true;
    const test = await create(data);
    fake.admin = false;
    expect(test.ok).toBe(true);
    const [testJob] = await db
      .select()
      .from(artJobs)
      .where(eq(artJobs.id, test.jobId!));
    expect(testJob.isTest).toBe(true);
    await processOneArtJob(test.jobId);
    expect(await publishCreativeTemplate(id, actor)).toBe(3);
    await activateCreativeVersion(id, 1, actor);
    expect(
      (await listCreativeTemplates()).find((item) => item.id === id)?.published
        ?.recipe.prompt,
    ).not.toContain("NEW DRAFT");
    expect(
      (
        await db
          .select()
          .from(creativeTemplateVersions)
          .where(
            and(
              eq(creativeTemplateVersions.templateId, id),
              eq(creativeTemplateVersions.version, 3),
            ),
          )
      )[0],
    ).toBeTruthy();
  });
  it("keeps one primary feature and rejects invisible features", async () => {
    const previous = (await listCreativeTemplates()).find(
      (item) => item.featured,
    );
    await setCreativeAvailability(
      {
        id,
        displayEnabled: true,
        creationEnabled: true,
        featured: true,
        sortOrder: 20,
      },
      actor,
    );
    expect(
      (await listCreativeTemplates())
        .filter((item) => item.featured)
        .map((item) => item.id),
    ).toEqual([id]);
    await expect(
      setCreativeAvailability(
        {
          id,
          displayEnabled: false,
          creationEnabled: false,
          featured: true,
          sortOrder: 20,
        },
        actor,
      ),
    ).rejects.toThrow("visible");
    await setCreativeAvailability(
      {
        id,
        displayEnabled: false,
        creationEnabled: false,
        featured: false,
        sortOrder: 20,
      },
      actor,
    );
    if (previous)
      await setCreativeAvailability(
        {
          id: previous.id,
          displayEnabled: previous.displayEnabled,
          creationEnabled: previous.creationEnabled,
          featured: true,
          sortOrder: previous.sortOrder,
        },
        actor,
      );
  });
});
