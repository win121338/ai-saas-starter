import { describe, expect, it } from "vitest";

import { t } from "@/lib/i18n-copy";
import { artJobFailureMessage } from "./job-feedback";

describe("art job feedback", () => {
  it("distinguishes an uncharged request from a refunded provider failure", () => {
    expect(artJobFailureMessage("insufficient_credits")).toContain(
      "Nothing was charged",
    );
    expect(artJobFailureMessage("provider_unavailable")).toContain(
      "credit was refunded",
    );
  });

  it("explains a model failure without showing an internal code", () => {
    expect(artJobFailureMessage("provider_processing_failed")).toContain(
      "Try another photo or style",
    );
    expect(artJobFailureMessage("unrecognized_code")).not.toContain(
      "unrecognized_code",
    );
  });

  it("shows the refund reason in Chinese when Chinese is selected", () => {
    expect(t("zh", artJobFailureMessage("provider_unavailable"))).toContain(
      "积分",
    );
  });
});
