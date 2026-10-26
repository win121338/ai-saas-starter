import { artModels } from "@/config/image-model-catalog";
import { requireAdmin } from "@/lib/admin/auth";
import {
  ANNOUNCEMENT_KEY,
  getSiteAnnouncement,
  listModelSettings,
  modelSettingKey,
} from "@/lib/admin/settings";
import { t } from "@/lib/i18n-copy";
import { getLocale } from "@/lib/i18n-server";
import { saveSystemSettingAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ result?: string }>;
}) {
  await requireAdmin();
  const locale = await getLocale();
  const params = await searchParams;
  const [announcement, modelSettings] = await Promise.all([
    getSiteAnnouncement(),
    listModelSettings(),
  ]);
  return (
    <div className="space-y-6">
      {params.result === "saved" ? (
        <p
          role="status"
          className="artora-surface border-primary/30 p-4 text-sm text-primary"
        >
          {t(locale, "Changes saved.")}
        </p>
      ) : null}
      {params.result === "invalid" ? (
        <p
          role="alert"
          className="artora-surface border-red-400/35 p-4 text-sm text-debit-text"
        >
          {t(locale, "Check the form values and try again.")}
        </p>
      ) : null}
      <section className="artora-surface p-5">
        <h2 className="font-heading text-xl font-bold">
          {t(locale, "Workspace announcement")}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t(
            locale,
            "Optional message shown above the studio. Leave empty to hide it.",
          )}
        </p>
        <form
          action={saveSystemSettingAction}
          className="mt-5 max-w-2xl space-y-3"
        >
          <input type="hidden" name="key" value={ANNOUNCEMENT_KEY} />
          <textarea
            name="value"
            maxLength={500}
            rows={3}
            defaultValue={announcement}
            className="w-full resize-y rounded-xl border border-border bg-secondary px-4 py-3 text-sm"
          />
          <button type="submit" className="artora-action px-5 text-sm">
            {t(locale, "Save announcement")}
          </button>
        </form>
      </section>
      <section className="artora-surface p-5">
        <h2 className="font-heading text-xl font-bold">
          {t(locale, "Image model switches")}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t(
            locale,
            "A disabled model cannot receive new jobs, even from a manually submitted form. API keys remain in environment variables.",
          )}
        </p>
        <div className="mt-5 divide-y divide-border">
          {artModels.map((model) => (
            <form
              key={model.id}
              action={saveSystemSettingAction}
              className="flex flex-wrap items-center justify-between gap-4 py-4"
            >
              <input
                type="hidden"
                name="key"
                value={modelSettingKey(model.id)}
              />
              <div>
                <p className="font-semibold">{model.label}</p>
                <p className="text-xs text-muted-foreground">
                  {model.provider} · {model.id}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  name="value"
                  defaultValue={modelSettings[model.id] ? "true" : "false"}
                  aria-label={`${model.label} ${t(locale, "availability")}`}
                  className="rounded-xl border border-border bg-secondary px-3 py-2 text-sm"
                >
                  <option value="true">{t(locale, "Enabled")}</option>
                  <option value="false">{t(locale, "Disabled")}</option>
                </select>
                <button
                  type="submit"
                  className="artora-quiet-action px-4 text-sm"
                >
                  {t(locale, "Save")}
                </button>
              </div>
            </form>
          ))}
        </div>
      </section>
    </div>
  );
}
