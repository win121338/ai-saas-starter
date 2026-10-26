"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, RefreshCw } from "lucide-react";

import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n-copy";
import { checkArtJobAction } from "./actions";

const stages = ["Queued", "Sent to model", "Creating artwork"] as const;

function elapsedLabel(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}m ${remainder.toString().padStart(2, "0")}s`;
}

export function StatusRefresher({
  jobId,
  status,
  failureCode,
  createdAt,
  updatedAt,
  driveLocalWorker,
  locale,
}: {
  jobId: string;
  status: string;
  failureCode: string | null;
  createdAt: string;
  updatedAt: string;
  driveLocalWorker: boolean;
  locale: Locale;
}) {
  const router = useRouter();
  const checking = useRef(false);
  const [isChecking, setIsChecking] = useState(false);
  const [checkFailed, setCheckFailed] = useState(false);
  const [now, setNow] = useState<number | null>(null);

  const checkNow = useCallback(async () => {
    if (checking.current) return;
    checking.current = true;
    setIsChecking(true);
    try {
      if (driveLocalWorker) await checkArtJobAction(jobId);
      setCheckFailed(false);
    } catch {
      setCheckFailed(true);
    } finally {
      router.refresh();
      checking.current = false;
      setIsChecking(false);
    }
  }, [driveLocalWorker, jobId, router]);

  useEffect(() => {
    const initialClock = setTimeout(() => setNow(Date.now()), 0);
    const clock = setInterval(() => setNow(Date.now()), 1_000);
    const refresh = setInterval(() => void checkNow(), 10_000);
    const initialCheck = driveLocalWorker
      ? setTimeout(() => void checkNow(), 0)
      : null;
    return () => {
      clearTimeout(initialClock);
      if (initialCheck !== null) clearTimeout(initialCheck);
      clearInterval(clock);
      clearInterval(refresh);
    };
  }, [checkNow, driveLocalWorker]);

  const elapsedSeconds =
    now === null
      ? null
      : Math.max(0, Math.floor((now - Date.parse(createdAt)) / 1_000));
  const stale = now !== null && now - Date.parse(updatedAt) > 90_000;
  const activeStage =
    status === "processing" || status === "refund_pending"
      ? 2
      : status === "submitting"
        ? 1
        : 0;
  const statusText =
    status === "refund_pending"
      ? "Returning your credit"
      : status === "queued" && failureCode === "provider_rate_limited"
        ? "The image service is busy. Your request is waiting to retry."
        : status === "processing" && failureCode === "provider_check_failed"
          ? "Could not reach the image service. Retrying status automatically."
          : status === "processing"
            ? "The model is creating your artwork."
            : status === "submitting"
              ? "Sending your photo to the model."
              : "Your request is waiting in the queue.";

  return (
    <section className="artora-surface space-y-4 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            {t(locale, "Artwork progress")}
          </p>
          <h2
            aria-live="polite"
            className="mt-1 font-heading text-lg font-bold"
          >
            {t(locale, statusText)}
          </h2>
        </div>
        <p className="text-sm tabular-nums text-muted-foreground">
          {t(locale, "Elapsed")} ·{" "}
          {elapsedSeconds === null ? "—" : elapsedLabel(elapsedSeconds)}
        </p>
      </div>

      <div
        className="artora-progress-track"
        role="progressbar"
        aria-label={t(locale, "Artwork progress")}
        aria-valuetext={t(locale, statusText)}
      >
        <span className="artora-progress-sweep" />
      </div>

      <ol className="grid grid-cols-3 gap-3 text-xs sm:text-sm">
        {stages.map((stage, index) => (
          <li
            key={stage}
            className={
              index <= activeStage ? "text-foreground" : "text-muted-foreground"
            }
          >
            <span
              className={`mr-2 inline-flex size-5 items-center justify-center rounded-full border text-[10px] ${index <= activeStage ? "border-primary bg-primary/15 text-primary" : "border-border"}`}
            >
              {index < activeStage ? <Check className="size-3" /> : index + 1}
            </span>
            {t(locale, stage)}
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
        <p>{t(locale, "Stages show activity, not an estimated percentage.")}</p>
        <button
          type="button"
          onClick={() => void checkNow()}
          disabled={isChecking}
          className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline disabled:opacity-50"
        >
          <RefreshCw
            className={`size-3.5 ${isChecking ? "animate-spin" : ""}`}
          />
          {t(locale, "Check status now")}
        </button>
      </div>

      {elapsedSeconds !== null && elapsedSeconds >= 120 ? (
        <p className="rounded-xl border border-primary/25 bg-primary/5 px-3 py-2 text-sm text-muted-foreground">
          {t(
            locale,
            "This is taking longer than usual. Your task is saved; you can return to this page later.",
          )}
        </p>
      ) : null}
      {stale ? (
        <p className="rounded-xl border border-amber-400/30 bg-amber-400/5 px-3 py-2 text-sm text-amber-200">
          {t(
            locale,
            "No new update has arrived for a while. Check the status again; please do not submit the same job twice.",
          )}
        </p>
      ) : null}
      {checkFailed ? (
        <p role="alert" className="text-sm text-debit-text">
          {t(locale, "Could not check the latest status. We will try again.")}
        </p>
      ) : null}
    </section>
  );
}
