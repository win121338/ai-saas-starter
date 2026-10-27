"use server";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { creativeDefinition, creativeId } from "@/lib/creative/schema";
import {
  activateCreativeVersion,
  publishCreativeTemplate,
  saveCreativeDraft,
  setCreativeAvailability,
} from "@/lib/creative/operations";
import { uploadCreativeMedia } from "@/lib/creative/media";
import { getLocale } from "@/lib/i18n-server";
import { localizedHref } from "@/lib/i18n";

function refresh() {
  revalidatePath("/", "layout");
}
async function back(id: string, error = "") {
  const locale = await getLocale();
  redirect(
    localizedHref(
      `/admin/templates?style=${encodeURIComponent(id)}&${error ? `error=${encodeURIComponent(error.slice(0, 240))}` : "result=saved"}`,
      locale,
    ),
  );
}
function message(error: unknown) {
  return error instanceof z.ZodError
    ? error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .slice(0, 3)
        .join("; ")
    : error instanceof Error
      ? error.message
      : "Check the form values and try again.";
}

export async function creativeDraftAction(form: FormData) {
  const session = await requireAdmin();
  let id = "";
  let previewVersion: number | null = null;
  try {
    const raw = z.string().max(2_000_000).parse(form.get("definition"));
    const definition = creativeDefinition.parse(JSON.parse(raw));
    id = definition.id;
    const intent = z
      .enum(["save", "publish", "preview"])
      .parse(form.get("intent") ?? "save");
    await saveCreativeDraft(
      definition,
      session.user.id,
      z
        .string()
        .optional()
        .parse(form.get("updatedAt") || undefined),
    );
    if (intent !== "save") {
      const version = await publishCreativeTemplate(
        id,
        session.user.id,
        intent === "preview",
        definition,
      );
      if (intent === "preview") previewVersion = version;
    }
  } catch (error) {
    return back(id, message(error));
  }
  refresh();
  if (previewVersion)
    redirect(
      localizedHref(
        `/generate?style=${id}&previewVersion=${previewVersion}`,
        await getLocale(),
      ),
    );
  return back(id);
}

export async function creativeImportAction(form: FormData) {
  const session = await requireAdmin();
  let id = "";
  try {
    const file = form.get("package");
    if (!(file instanceof File) || file.size > 2_000_000)
      throw new Error("Choose a JSON package under 2 MB.");
    id = await saveCreativeDraft(
      JSON.parse(await file.text()),
      session.user.id,
    );
  } catch (error) {
    return back(id, message(error));
  }
  refresh();
  return back(id);
}

export async function creativeLocalImportAction() {
  const session = await requireAdmin();
  let id = "";
  try {
    const directory = path.join(process.cwd(), "content/case-templates");
    const registry = z
      .object({ templateIds: z.array(creativeId).max(200) })
      .parse(
        JSON.parse(
          await readFile(path.join(directory, "catalog.json"), "utf8"),
        ),
      );
    for (const item of registry.templateIds)
      id = await saveCreativeDraft(
        JSON.parse(
          await readFile(
            path.join(directory, item, "creative-template.json"),
            "utf8",
          ),
        ),
        session.user.id,
      );
  } catch (error) {
    return back(id, message(error));
  }
  refresh();
  return back(id);
}

export async function creativeAvailabilityAction(form: FormData) {
  const session = await requireAdmin();
  let id = "";
  try {
    id = creativeId.parse(form.get("id"));
    await setCreativeAvailability(
      {
        id,
        displayEnabled: form.get("displayEnabled") === "on",
        creationEnabled: form.get("creationEnabled") === "on",
        featured: form.get("featured") === "on",
        sortOrder: z.coerce
          .number()
          .int()
          .min(0)
          .max(100000)
          .parse(form.get("sortOrder")),
      },
      session.user.id,
    );
  } catch (error) {
    return back(id, message(error));
  }
  refresh();
  return back(id);
}

export async function creativeActivateAction(form: FormData) {
  const session = await requireAdmin();
  let id = "";
  try {
    id = creativeId.parse(form.get("id"));
    await activateCreativeVersion(
      id,
      z.coerce.number().int().positive().parse(form.get("version")),
      session.user.id,
    );
  } catch (error) {
    return back(id, message(error));
  }
  refresh();
  return back(id);
}

export async function creativeUploadAction(form: FormData) {
  const session = await requireAdmin();
  try {
    const file = form.get("image");
    if (!(file instanceof File)) throw new Error("Choose an image.");
    return {
      ok: true as const,
      image: await uploadCreativeMedia(file, session.user.id),
    };
  } catch (error) {
    return { ok: false as const, error: message(error) };
  }
}
