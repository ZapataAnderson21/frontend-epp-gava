export type SsomaTalkStatus =
  | "draft"
  | "inProgress"
  | "open"
  | "closing"
  | "closed"
  | "voided"
  | "annulled";

export type SsomaAttendanceStatus =
  | "PENDING"
  | "SIGNING"
  | "SIGNED"
  | "DECLINED"
  | "REMOVED"
  | "VOIDED";

export interface SsomaProjectSummary {
  projectId: number;
  code: string;
  name: string;
}

export interface SsomaAttendance {
  ssomaTalkAttendanceId: number;
  workerId: number;
  attendanceDate: string;
  status: SsomaAttendanceStatus;
  worker: { workerId: number; fullName: string };
}

export interface SsomaAttendanceRecord {
  ssomaTalkAttendanceId: number;
  ssomaTalkId: number;
  workerId: number;
  attendanceDate: string;
  status: SsomaAttendanceStatus;
}

export interface SsomaTalk {
  ssomaTalkId: number;
  projectId: number;
  talkDate: string;
  topic: string;
  trainer: string | null;
  location: string | null;
  targetAudience: string | null;
  scheduledTime: string | null;
  durationMinutes: number | null;
  observations: string | null;
  responsibleName: string | null;
  responsiblePosition: string | null;
  status: SsomaTalkStatus;
  createdAt: string;
  updatedAt: string;
  project: SsomaProjectSummary;
  attendances: SsomaAttendance[];
}

export interface SsomaTalkDraft {
  projectId: number;
  talkDate: string;
  topic: string;
  trainer?: string | null;
  location?: string | null;
  targetAudience?: string | null;
  scheduledTime?: string | null;
  durationMinutes?: number | null;
  observations?: string | null;
  responsibleName?: string | null;
  responsiblePosition?: string | null;
}

export type SsomaTalkUpdate = Omit<SsomaTalkDraft, "projectId">;

export interface SsomaPagination {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface SsomaTalkList {
  items: SsomaTalk[];
  pagination: SsomaPagination;
}

export interface SsomaWorker {
  workerId: number;
  fullName: string;
  dni: string;
}

export interface SsomaWorkerList {
  items: SsomaWorker[];
  pagination: SsomaPagination;
}

export interface SsomaWorkerAvailability {
  workerId: number;
  available: boolean;
}

export interface SsomaSignatureResult {
  attendanceId: number;
  status: "SIGNED";
}

export interface SsomaDocumentVersionSummary {
  ssomaTalkDocumentVersionId: number;
  versionNumber: number;
  status: "CURRENT" | "HISTORICAL";
  sha256: string;
  byteSize: string;
  publishedAt: string;
  createdAt?: string;
  replacesVersionId?: number | null;
}

export interface SsomaRevisionSummary {
  ssomaTalkRevisionId: number;
  revisionNumber: number;
  authoredByUserId: number;
  createdAt: string;
  baseVersionId: number | null;
}

export type SsomaRevisionStartResult = Pick<SsomaRevisionSummary, "ssomaTalkRevisionId" | "revisionNumber" | "authoredByUserId" | "createdAt">;

export interface SsomaRevisionDraft {
  reason: string;
  attendanceIdsToVoid: number[];
  topic?: string;
  trainer?: string | null;
  location?: string | null;
  targetAudience?: string | null;
  scheduledTime?: string | null;
  durationMinutes?: number | null;
  observations?: string | null;
  responsibleName?: string | null;
  responsiblePosition?: string | null;
}

export interface SsomaPublicationReconciliation {
  publicationId: number;
  failureCode: string;
  createdAt: string;
  artifactVerified: boolean;
  canRetry: boolean;
}

export interface SsomaAuditEvent {
  ssomaTalkAuditEventId: number;
  ssomaTalkId: number;
  attendanceTalkId: number | null;
  ssomaTalkAttendanceId: number | null;
  actorUserId: number;
  eventType: string;
  previousState: string | null;
  newState: string | null;
  changedFields: unknown;
  reason: string | null;
  serverAt: string;
  actor: { userId: number; name: string; lastName: string } | null;
}

export interface SsomaAuditList {
  items: SsomaAuditEvent[];
  pagination: SsomaPagination;
}

export interface SsomaEnvelope<T> {
  statusCode: number;
  message: string;
  data: T;
}

export interface SsomaTalkQuery {
  page: number;
  pageSize: number;
  search?: string;
  projectId?: number;
  status?: SsomaTalkStatus;
  dateFrom?: string;
  dateTo?: string;
}
