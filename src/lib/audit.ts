import { prisma } from "@/lib/prisma";
import { AuditAction, Prisma } from "@prisma/client";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

interface AuditLogParams {
  action: AuditAction;
  resource: string;
  resourceId?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  patientId?: string;
  // Optional override for user info (for cases where we don't have session)
  userId?: string;
  userEmail?: string;
  userName?: string;
}

/**
 * Log an audit event for HIPAA compliance
 * Automatically captures user info from session and request context
 */
export async function logAudit(params: AuditLogParams): Promise<void> {
  try {
    // Get session info
    const session = await auth();

    // Get request headers for IP and user agent
    const headersList = await headers();
    const forwardedFor = headersList.get("x-forwarded-for");
    const ipAddress = forwardedFor?.split(",")[0]?.trim() ||
                      headersList.get("x-real-ip") ||
                      "unknown";
    const userAgent = headersList.get("user-agent") || undefined;

    // Use provided user info or fall back to session
    const userId = params.userId || session?.user?.id || null;
    const userEmail = params.userEmail || session?.user?.email || null;
    const userName = params.userName || session?.user?.name || null;

    await prisma.auditLog.create({
      data: {
        userId,
        userEmail,
        userName,
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId,
        description: params.description,
        metadata: params.metadata as Prisma.InputJsonValue | undefined,
        patientId: params.patientId,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    // Log to console but don't throw - audit logging should never break the app
    console.error("Audit logging error:", error instanceof Error ? error.name : "Unknown");
  }
}

/**
 * Log patient data access (convenience wrapper)
 */
export async function logPatientAccess(
  patientId: string,
  action: "VIEW" | "LIST" | "UPDATE" | "CREATE" | "DELETE" | "EXPORT",
  resource: string,
  resourceId?: string,
  description?: string
): Promise<void> {
  await logAudit({
    action: action as AuditAction,
    resource,
    resourceId,
    patientId,
    description: description || `${action} ${resource}`,
  });
}

/**
 * Log authentication events
 */
export async function logAuthEvent(
  action: "LOGIN" | "LOGOUT" | "LOGIN_FAILED",
  userEmail?: string,
  userId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await logAudit({
    action: action as AuditAction,
    resource: "Authentication",
    userId,
    userEmail,
    description: `User ${action.toLowerCase().replace("_", " ")}`,
    metadata,
  });
}

/**
 * Log AI/Chat interactions (important for HIPAA - tracks PHI sent to AI)
 */
export async function logAIInteraction(
  patientId: string,
  action: "AI_QUERY" | "AI_RESPONSE",
  metadata?: Record<string, unknown>
): Promise<void> {
  await logAudit({
    action: action as AuditAction,
    resource: "AI_Chat",
    patientId,
    description: action === "AI_QUERY" ? "Patient data sent to AI" : "AI response received",
    metadata,
  });
}

/**
 * Log encounter events (signing, co-signing, amendments - HIPAA critical)
 */
export async function logEncounterEvent(
  encounterId: string,
  patientId: string,
  action: "SIGN" | "COSIGN" | "AMEND" | "CREATE" | "UPDATE" | "VIEW",
  description?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await logAudit({
    action: action as AuditAction,
    resource: "Encounter",
    resourceId: encounterId,
    patientId,
    description: description || `Encounter ${action.toLowerCase()}`,
    metadata,
  });
}

/**
 * Log injection administration (compliance critical for peptide clinics)
 */
export async function logInjectionAdministration(
  injectionId: string,
  patientId: string,
  metadata: {
    medication: string;
    dose: string;
    lotNumber?: string;
    administeredById: string;
  }
): Promise<void> {
  await logAudit({
    action: "CREATE" as AuditAction,
    resource: "Injection",
    resourceId: injectionId,
    patientId,
    description: `Administered ${metadata.medication} ${metadata.dose}`,
    metadata: {
      ...metadata,
      type: "injection_administration",
    },
  });
}

/**
 * Log clinical data changes (allergies, medications, diagnoses, supplements)
 */
export async function logClinicalDataChange(
  patientId: string,
  dataType: "Allergy" | "Medication" | "Diagnosis" | "Supplement",
  action: "CREATE" | "UPDATE" | "DELETE",
  resourceId: string,
  description?: string
): Promise<void> {
  await logAudit({
    action: action as AuditAction,
    resource: `Patient${dataType}`,
    resourceId,
    patientId,
    description: description || `${action} ${dataType.toLowerCase()}`,
  });
}
