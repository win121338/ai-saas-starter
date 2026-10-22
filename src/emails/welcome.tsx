import { WELCOME_CREDITS } from "@/config/plans";

import { EmailButton } from "./components/button";
import {
  EmailHeading,
  EmailLayout,
  EmailMuted,
  EmailText,
  emailTheme,
} from "./components/layout";

export default function WelcomeEmail({
  name = "there",
  appUrl = "http://localhost:3000",
}: {
  name?: string;
  appUrl?: string;
}) {
  return (
    <EmailLayout preview="Welcome to your Artora workspace.">
      <EmailHeading>Welcome, {name}.</EmailHeading>
      <EmailText>
        Your account is live and{" "}
        <span style={{ color: emailTheme.credit, fontWeight: 600 }}>
          {WELCOME_CREDITS} welcome credits
        </span>{" "}
        are already on it for the starter&apos;s existing text-to-image demo.
        The new photo-to-art studio is being prepared separately.
      </EmailText>
      <EmailButton href={`${appUrl}/generate`}>Explore the studio</EmailButton>
      <EmailMuted>
        You can preview a photo and choose a style without spending credits.
      </EmailMuted>
    </EmailLayout>
  );
}
