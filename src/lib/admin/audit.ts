import "server-only";

import { adminAuditEvents } from "@/db/schema";

type AuditInput = {
  actorUserId: string;
  action: string;
  targetType: string;
  targetId: string;
  details?: string;
};

export function auditValues(input: AuditInput) {
  return {
    actorUserId: input.actorUserId,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    details: input.details ?? null,
  } satisfies typeof adminAuditEvents.$inferInsert;
}
