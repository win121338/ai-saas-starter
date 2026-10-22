import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

// Email-safe Artora colors; web font variables are unavailable in mail clients.
export const emailTheme = {
  paper: "#141821",
  paper2: "#0b0d12",
  ink: "#f4f6fa",
  muted: "#a8b1c2",
  hairline: "#2c3342",
  accent: "#ffaa54",
  accentInk: "#17120d",
  credit: "#8de0b8",
  mono: "'Courier New', Courier, monospace",
  sans: "Helvetica, Arial, sans-serif",
} as const;

export function EmailLayout({
  preview,
  children,
}: {
  preview: string;
  children: React.ReactNode;
}) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: emailTheme.paper2,
          fontFamily: emailTheme.sans,
          color: emailTheme.ink,
          margin: 0,
          padding: "24px 12px",
        }}
      >
        <Container
          style={{
            backgroundColor: emailTheme.paper,
            border: `1px solid ${emailTheme.hairline}`,
            borderRadius: 16,
            maxWidth: 520,
            padding: "0 32px 28px",
          }}
        >
          <Section style={{ borderBottom: `1px solid ${emailTheme.hairline}` }}>
            <Text
              style={{
                fontFamily: emailTheme.mono,
                fontSize: 13,
                letterSpacing: "0.04em",
                margin: "18px 0 14px",
              }}
            >
              <span style={{ color: emailTheme.accent }}>✦</span> Artora
            </Text>
          </Section>
          {children}
          <Hr
            style={{
              borderColor: emailTheme.hairline,
              margin: "28px 0 14px",
            }}
          />
          <Text
            style={{
              fontFamily: emailTheme.mono,
              fontSize: 10,
              letterSpacing: "0.06em",
              color: emailTheme.muted,
              margin: 0,
            }}
          >
            Artora · Your creative space
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export function EmailHeading({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        fontSize: 20,
        fontWeight: 600,
        letterSpacing: "-0.01em",
        margin: "24px 0 8px",
      }}
    >
      {children}
    </Text>
  );
}

export function EmailText({ children }: { children: React.ReactNode }) {
  return (
    <Text style={{ fontSize: 14.5, lineHeight: "24px", margin: "8px 0" }}>
      {children}
    </Text>
  );
}

export function EmailMuted({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        fontSize: 13,
        lineHeight: "21px",
        color: emailTheme.muted,
        margin: "8px 0 0",
      }}
    >
      {children}
    </Text>
  );
}
