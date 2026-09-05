export interface Amounts {
  income: number;
  materials: number;
  services: number;
  payroll: number;
  pettyCash: number;
  adjustments: number;
  expenses: number;
  result: number;
}

export interface PayrollWeek {
  weekId: number;
  startDate: string;
  endDate: string;
  includedInMonth: boolean;
  total: number;
  groups: {
    group: "laborer" | "technician";
    workerCount: number;
    attendances: number;
    dominical: number;
    base: number;
    adjustments: number;
    total: number;
  }[];
}

export interface GeneralDashboardData {
  generatedAt: string;
  period: {
    month: number;
    year: number;
    currency: string;
    projectId: number | null;
  };
  permissions: {
    finance: boolean;
    purchases: boolean;
    payroll: boolean;
    documents: boolean;
  };
  projectOptions: { projectId: number; code: string; name: string }[];
  activeProjects: number;
  finances:
    | (Amounts & {
        previous: Amounts;
        pendingPurchases: number;
        trend: (Amounts & { month: string })[];
      })
    | null;
  payroll: {
    currency: string;
    total: number;
    projectOnly: boolean;
    weeks: PayrollWeek[];
  } | null;
  projects: {
    projectId: number;
    code: string;
    name: string;
    status: "active" | "inactive" | "completed";
    endDate: string | null;
    progress: number | null;
    overdueTasks: number;
    overdue: boolean;
    pendingRequests: number;
    pendingOrders: number;
    finances: Amounts | null;
  }[];
  alerts: {
    key: string;
    title: string;
    detail: string;
    count: number;
    severity: "critical" | "warning";
    href: string;
    scope: "project" | "global";
  }[];
  criticalCount: number;
}
