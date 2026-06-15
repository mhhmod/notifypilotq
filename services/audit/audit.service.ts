import { getStore, newId } from "@/lib/data/store";
import type { AuditLog } from "@/types/domain";

export function recordAuditLog(input: Omit<AuditLog, "id" | "tenantId" | "createdAt">) {
  const store = getStore();
  const auditLog: AuditLog = {
    id: newId("audit"),
    tenantId: store.tenant.id,
    createdAt: new Date().toISOString(),
    ...input
  };

  store.auditLogs.unshift(auditLog);
  return auditLog;
}
