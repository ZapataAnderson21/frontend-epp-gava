export type PayrollWorkerGroup = "laborer" | "technician";

export interface GeneralPayrollWeekCard {
  weekId: number;
  startDate: string;
  endDate: string;
  initialized: boolean;
  projectCount: number;
  workerCount: number;
  totalAmount: number;
}

export interface PayrollProjectOption {
  projectId: number;
  name: string;
  code: string;
}

export interface PayrollWorkerOption {
  workerId: number;
  fullName: string;
  dni: string;
  workerType: string;
  currentDailyWage: number;
}

export interface GeneralPayrollWorker {
  generalPayrollWorkerId: number;
  workerId: number;
  group: PayrollWorkerGroup;
  displayOrder: number;
  dailyWage: number;
  additionalAmount: number;
  liquidationAmount: number;
  sundayDinnerAmount: number;
  worker: PayrollWorkerOption;
}

export interface GeneralPayrollEntry {
  generalPayrollEntryId: number;
  generalPayrollProjectId: number;
  generalPayrollWorkerId: number;
  isActive: boolean;
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
  dominical: number;
  overtimeAmount: number;
  afpDiscount: number;
  advanceDiscount: number;
}

export interface GeneralPayrollProject {
  generalPayrollProjectId: number;
  projectId: number;
  displayOrder: number;
  project: PayrollProjectOption;
  entries: GeneralPayrollEntry[];
}

export interface GeneralPayroll {
  generalPayrollId: number;
  weekId: number;
  projects: GeneralPayrollProject[];
  workers: GeneralPayrollWorker[];
}

export interface GeneralPayrollDetail {
  initialized: boolean;
  week: {
    weekId: number;
    startDate: string;
    endDate: string;
  };
  previousPayrollWeekId: number | null;
  activeProjects: PayrollProjectOption[];
  availableWorkers: PayrollWorkerOption[];
  payroll: GeneralPayroll | null;
}

export interface ProjectPayrollWorkerDetail {
  generalPayrollEntryId: number;
  workerId: number;
  fullName: string;
  dni: string;
  group: PayrollWorkerGroup;
  attendance: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    dominical: boolean;
  };
  attendanceCount: number;
  dailyWage: number;
  overtimeAmount: number;
  grossAmount: number;
  afpDiscount: number;
  advanceDiscount: number;
  paidAmount: number;
}

export interface ProjectPayrollWeekDetail {
  weekId: number;
  startDate: string;
  endDate: string;
  laborerAmount: number;
  technicianAmount: number;
  totalAmount: number;
  workers: ProjectPayrollWorkerDetail[];
}

export interface ProjectPayrollDetail {
  project: PayrollProjectOption;
  weekCount: number;
  laborerAmount: number;
  technicianAmount: number;
  totalAmount: number;
  weeks: ProjectPayrollWeekDetail[];
}
