export interface WorkerPayrollDetail {
  workerId: number;
  workerName: string;
  workerType: string;
  attendances: number;
  dailyWage: number;
  grossAmount: number;
  afpDiscount: number;
  advanceDiscount: number;
  weeklyWage: number;
}

export interface WeekPayrollDetail {
  weekId: number;
  startDate: string;
  endDate: string;
  workers: WorkerPayrollDetail[];
  summary: {
    totalGross: number;
    totalAfp: number;
    totalAdvance: number;
    totalNet: number;
  };
}

export interface WeekSummary {
  weekId: number;
  startDate: string;
  endDate: string;
  totalWorkers: number;
  totalAttendances: number;
}
