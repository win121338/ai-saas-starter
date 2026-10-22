import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  robots: { index: false },
};

export default function PrivacyPage() {
  return (
    <div className="artora-shell flex-1">
      <div className="mx-auto max-w-[800px] px-5 py-20 md:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Launch preparation
        </p>
        <h1 className="mt-4 font-heading text-4xl font-extrabold">
          Privacy information
        </h1>
        <div className="artora-surface mt-8 space-y-4 p-7 text-sm leading-7 text-muted-foreground">
          <p>
            When you create artwork, your selected photo is uploaded to the
            server, resized, converted to WebP, and stripped of embedded image
            metadata. The original and result are stored privately and can be
            viewed only through your signed-in account.
          </p>
          <p>
            Account registration uses the project&apos;s authentication system
            and stores the account information needed to sign in. The separate
            legacy text-to-image demo uses the starter&apos;s existing
            generation and credit records. Photo-to-art jobs also record the
            chosen style, status, and credit spend or refund.
          </p>
          <p>
            In local demo mode, no image is sent to a model provider. When the
            fal provider is enabled, the processed photo and edit instruction
            are sent to fal to generate the artwork. See{" "}
            <a href="https://fal.ai/legal/privacy-policy" className="text-primary hover:underline">
              fal&apos;s privacy policy
            </a>{" "}
            for its own handling of submitted data.
          </p>
          <p>
            After a job finishes, its input is scheduled for deletion within 24
            hours; the result is retained for up to 30 days. Files for a job
            awaiting reconciliation may be kept longer so its outcome can be
            resolved. You can delete a completed creation from your account.
            Account deletion removes its stored photo-to-art files.
          </p>
          <p>
            This pre-launch notice will be replaced with the final privacy
            policy before the public service opens.
          </p>
        </div>
      </div>
    </div>
  );
}
