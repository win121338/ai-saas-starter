import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n-copy";
import { getLocale } from "@/lib/i18n-server";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// The ledger register (DESIGN.md > Components > Table), specialized for
// credit_transactions-shaped data. Presentational only — callers format
// timestamps and refs. `animated` staggers rows in (marketing hero art);
// the effect is motion-safe and disabled under prefers-reduced-motion.

export type LedgerEntry = {
  id: string;
  /** Preformatted, e.g. "2026-07-12 09:14". */
  timestamp: string;
  /** Ledger type, e.g. "subscription_grant", "spend", "refund", "expiry". */
  type: string;
  /** Preformatted reference, e.g. "invoice in_1Nx4h2". */
  ref: string;
  /**
   * Signed credits. Positive renders green; negative renders ink — a
   * routine spend is normal operation, not a warning. Only expiry rows
   * render debit red (DESIGN.md token notes).
   */
  amount: number;
};

function formatAmount(amount: number): string {
  // U+2212 minus sign — same advance width as "+" in Martian Mono.
  return amount > 0 ? `+${amount}` : `−${Math.abs(amount)}`;
}

async function LedgerTable({
  entries,
  animated = false,
  className,
}: {
  entries: LedgerEntry[];
  animated?: boolean;
  className?: string;
}) {
  const locale = await getLocale();
  return (
    <Table className={className}>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>{t(locale, "Date")}</TableHead>
          <TableHead>{t(locale, "Type")}</TableHead>
          <TableHead>{t(locale, "Ref")}</TableHead>
          <TableHead className="text-right">{t(locale, "Amount")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry, i) => (
          <TableRow
            key={entry.id}
            className={
              animated
                ? "motion-safe:animate-[ledger-in_200ms_ease-out_both]"
                : undefined
            }
            style={animated ? { animationDelay: `${i * 60}ms` } : undefined}
          >
            <TableCell className="font-mono text-xs text-muted-foreground">
              {entry.timestamp}
            </TableCell>
            <TableCell className="font-mono text-xs">
              {t(locale, entry.type.replaceAll("_", " "))}
            </TableCell>
            <TableCell className="font-mono text-xs text-muted-foreground">
              {entry.ref}
            </TableCell>
            <TableCell
              className={cn(
                "text-right font-mono",
                entry.amount > 0 && "text-primary-text",
                entry.type === "expiry" && "text-debit-text",
              )}
            >
              {formatAmount(entry.amount)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export { LedgerTable };
