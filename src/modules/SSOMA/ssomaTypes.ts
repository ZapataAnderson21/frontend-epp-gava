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
