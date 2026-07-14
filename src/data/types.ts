export interface ElementVariantType {
  elementVariantId: number;
  label: string;
  normalizedLabel: string;
  code?: string | null;
  description?: string | null;
}

export interface InventoryAssetSummary {
  totalAssets: number;
  availableAssets: number;
  assignedAssets: number;
  maintenanceAssets: number;
  retiredAssets: number;
}

export interface ElementType {
  elementId: number;
  name: string;
  type: string;
  description: string;
  code?: string | null;
  family?: string | null;
  familyLabel?: string | null;
  categoryName?: string | null;
  stockMinimum?: number;
  controlType?: string;
  brand?: string | null;
  model?: string | null;
  size?: string | null;
  serialNumber?: string | null;
  technicalSheetLink?: string | null;
  operationalStatus?: string | null;
  manufactureDate?: string | null;
  expirationDate?: string | null;
  typeLabel?: string;
  controlTypeLabel?: string;
  deletedAt?: string | null;
  isLegacy?: boolean;
  isArchived?: boolean;
  legacyWarning?: string | null;
  supportsVariants?: boolean;
  variants?: ElementVariantType[];
  variantCount?: number;
  assetSummary?: InventoryAssetSummary;
  fallProtectionGroupId?: number | null;
  fallProtectionGroup?: FallProtectionGroupType | null;
}

export interface ElementCategoryType {
  elementCategoryId: number;
  name: string;
  description?: string | null;
  activeElementCount: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface FallProtectionGroupType {
  fallProtectionGroupId: number;
  code: string;
  description?: string | null;
  harnessElementId: number;
  anchorBandElementId: number;
  lifelineElementId: number;
  positioningLanyardElementId: number;
  harnessElement?: ElementType;
  anchorBandElement?: ElementType;
  lifelineElement?: ElementType;
  positioningLanyardElement?: ElementType;
  components?: FallProtectionGroupComponentType[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface FallProtectionGroupComponentType {
  fallProtectionGroupComponentId: number;
  fallProtectionGroupId: number;
  elementId: number;
  role: "harness" | "anchorBand" | "lifeline" | "positioningLanyard";
  element?: ElementType;
  createdAt: string;
}

export interface CreateElementDto {
  name: string;
  type: string;
  description: string;
  code?: string | null;
  family?: string | null;
  categoryName?: string | null;
  stockMinimum?: number;
  controlType?: string;
  brand?: string | null;
  model?: string | null;
  size?: string | null;
  serialNumber?: string | null;
  technicalSheetLink?: string | null;
  operationalStatus?: string | null;
  manufactureDate?: string | null;
  expirationDate?: string | null;
  variantLabels?: string[];
}

export interface UpdateElementDto {
  name: string;
  type: string;
  description: string;
  code?: string | null;
  family?: string | null;
  categoryName?: string | null;
  stockMinimum?: number;
  controlType?: string;
  brand?: string | null;
  model?: string | null;
  size?: string | null;
  serialNumber?: string | null;
  technicalSheetLink?: string | null;
  operationalStatus?: string | null;
  manufactureDate?: string | null;
  expirationDate?: string | null;
  variantLabels?: string[];
}

export interface ElementRequestType {
  elementRequestId?: number
  quantityRequested: number
    unit: string
    elementId: number
    elementVariantId?: number | null
    fallProtectionGroupId?: number | null
    lineItemOrder?: number
  notes?: string | null
  lineKey?: string
  requestId: number
    element?: ElementType
    elementVariant?: ElementVariantType | null
    fallProtectionGroup?: FallProtectionGroupType | null
    elementRequestResponses?: ElementRequestResponseType[]
  epiPlans?: ElementRequestWorkerPlan[]
}

export interface CreateElementRequestDto {
  quantityRequested: number
  unit: string
    elementId: number
    elementVariantId?: number | null
    fallProtectionGroupId?: number | null
    lineItemOrder?: number
  notes?: string | null
  requestId: number
}

export interface UpdateElementRequestDto {
  elementRequestId?: number
  quantityRequested: number
  unit: string
    elementId: number
    elementVariantId?: number | null
    fallProtectionGroupId?: number | null
    lineItemOrder?: number
  notes?: string | null
  requestId: number
}

export interface ElementRequestResponseType {
  elementRequestResponseId: number
  elementRequestId: number
  quantityAccepted: number
  selectedElementIds?: number[]
  requestResponseId: number
  elementRequest?: ElementRequestType
  requestResponse?: RequestResponseType
}

export interface CreateElementRequestResponseDto {
  elementRequestId: number
  quantityAccepted: number
  selectedElementIds?: number[]
  requestResponseId: number
}

export interface UpdateElementRequestResponseDto {
  elementRequestId?: number
  quantityAccepted: number
  selectedElementIds?: number[]
  requestResponseId: number
}

export interface EmergencyType {
  emergencyId: number;
  image: string; 
  title: string; 
  description: string;
  userId: number;
  projectId: number;
  createdAt: string;
  status: string;
  user?: User;
  project?: Project;
  userName?: string;
  projectName?: string;
}

export interface CreateEmergencyDto {
  image: string; 
  title: string; 
  description: string;
  userId: number;
  projectId: number;
}

export interface UpdateEmergencyDto {
  image?: string; 
  title?: string; 
  description?: string;
  userId?: number;
  projectId?: number;
  createdAt?: string;
  status?: string;
}

export interface Project {
  projectId: number;
  name: string;
  code: string;
  description: string;
  status: string;
  location: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;

  requests?: RequestType[];
  emergencies?: EmergencyType[];
  purchaseOrders?: PurchaseOrder[];
  pettyCashes?: PettyCashType[];
  serviceSales?: ServiceSaleType[];
}

export interface CreateProjectDto {
  name: string;
  description: string;
  code: string
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
  code?: string;
  status?: string;
}

export interface RequestType {
  requestId: number
  createdAt: string
  deliveryDueDate: string
  status: string
  description?: string
  projectId: number
  userId: number
  type: string
  inventoryLoadedAt?: string | null
  user?: User
  project?: Project
  elementRequests?: ElementRequestType[]
  requestWorkers?: RequestWorker[]
  userName?: string
}

export interface ProjectInventoryEntry {
  projectInventoryEntryId: number;
  projectId: number;
  projectName?: string | null;
  projectCode?: string | null;
  requestId: number;
  elementId: number;
  elementVariantId?: number | null;
  fallProtectionGroupId?: number | null;
  fallProtectionGroup?: FallProtectionGroupType | null;
  fallProtectionParts?: string[];
  elementVariantLabel?: string | null;
  elementName: string;
  elementCode?: string | null;
  elementType: string;
  elementTypeLabel?: string;
  family?: string | null;
  familyLabel?: string | null;
  isLegacy?: boolean;
  returnsToOffice?: boolean;
  requiresCode?: boolean;
  usesDecimalQuantity?: boolean;
  usesUniqueInventory?: boolean;
  controlType: string;
  controlTypeLabel?: string;
  categoryName?: string | null;
  unit: string;
  quantityReceived: number;
  quantityReturned: number;
  quantityPending: number;
  quantityAssignedToWorkers?: number;
  quantityAvailableForAssignment?: number;
  quantityAvailableForReturn?: number;
  quantityRequiredForProjectClosure?: number;
  workerAssignments?: WorkerInventoryAssignment[];
  projectInventoryEntryIds?: number[];
  requestIds?: number[];
  blocksProjectInactivation: boolean;
  responsibleUserId: number;
  responsibleUserName?: string | null;
  responsibleUserNames?: string[];
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
}

export interface ProjectInventoryResponse {
  project: {
    projectId: number;
    name: string;
    code: string;
    status: string;
  };
  summary: {
    totalEntries: number;
    totalPendingReturn: number;
    pendingBlockingEntries: number;
  };
  entries: ProjectInventoryEntry[];
}

export interface InventoryMovement {
  inventoryMovementId: number;
  movementType: string;
  fromLocation: string;
  toLocation: string;
  quantity: number;
  notes?: string | null;
  createdAt: string;
  projectId?: number | null;
  projectName?: string | null;
  projectCode?: string | null;
  workerId?: number | null;
  workerName?: string | null;
  requestId?: number | null;
  elementId: number;
  elementName?: string | null;
  elementCode?: string | null;
  elementVariantId?: number | null;
  elementVariantLabel?: string | null;
  performedByUserName?: string | null;
  responsibleUserName?: string | null;
}

export interface OfficeInventoryEntry {
  officeInventoryEntryId: number;
  elementId: number;
  elementVariantId?: number | null;
  elementVariantLabel?: string | null;
  elementName: string;
  elementCode?: string | null;
  elementType: string;
  family?: string | null;
  familyLabel?: string | null;
  categoryName?: string | null;
  unit: string;
  currentStock: number;
  status: string;
  purchaseOrderId?: number | null;
  purchaseOrderCode?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
}

export interface InventoryDashboardDeliveredItem {
  elementId: number;
  elementName: string;
  family?: string | null;
  familyLabel: string;
  deliveredQuantity: number;
}

export interface InventoryDashboardMinimumStockItem {
  elementId: number;
  elementName: string;
  family?: string | null;
  familyLabel: string;
  categoryName?: string | null;
  officeStock: number;
  projectStock: number;
  totalStock: number;
  stockMinimum: number;
  distanceToMinimum: number;
}

export interface InventoryDashboardResponse {
  period: {
    month: number;
    year: number;
  };
  mostDelivered: InventoryDashboardDeliveredItem[];
  minimumStock: InventoryDashboardMinimumStockItem[];
  latestMovements: InventoryMovement[];
}

export type ExpiringDocumentStatus = "expired" | "upcoming" | "valid";

export interface ExpiringDocumentCategory {
  expiringDocumentCategoryId: number;
  name: string;
  description?: string | null;
  alertDaysFirst: number;
  alertDaysSecond: number;
  alertDaysThird: number;
  notificationEmails: string[];
  emailNotificationsEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  _count?: { documents: number };
}

export interface ExpiringDocument {
  expiringDocumentId: number;
  categoryId: number;
  title: string;
  documentCode?: string | null;
  referenceType: string;
  referenceDescription: string;
  storageSpace: string;
  storagePath?: string | null;
  storageDescription?: string | null;
  issueDate?: string | null;
  expirationDate: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  category: ExpiringDocumentCategory;
  status: ExpiringDocumentStatus;
  daysRemaining: number;
  createdBy?: { userId: number; name: string; lastName: string };
  updatedBy?: { userId: number; name: string; lastName: string };
}

export interface ExpiringDocumentListResponse {
  items: ExpiringDocument[];
  total: number;
  limit: number;
  offset: number;
}

export interface ExpiringDocumentDashboardResponse {
  period: { month: number; year: number };
  counts: Record<ExpiringDocumentStatus, number>;
  items: ExpiringDocument[];
}

export interface ExpiringDocumentHistory {
  expiringDocumentHistoryId: number;
  action: "created" | "updated" | "deleted" | "restored";
  snapshot: Record<string, unknown>;
  createdAt: string;
  changedBy: { userId: number; name: string; lastName: string };
}

export interface ElementInventoryDetail {
  element: ElementType;
  summary: {
    totalOfficeStock?: number;
    totalReceived: number;
    totalReturned: number;
    totalPending: number;
  };
  officeEntries: OfficeInventoryEntry[];
  currentLocations: ProjectInventoryEntry[];
  movementHistory: InventoryMovement[];
}

export interface CreateRequestDto {
  deliveryDueDate: string
  description?: string
  projectId: number
  userId: number
  type: string
}

export interface UpdateRequestDto {
  createdAt?: string
  status?: string
  deliveryDueDate?: string
  description?: string
  projectId?: number
  userId?: number
  type?: string
}

export interface RequestResponseType {
  requestResponseId: number
  requestId: number
  responderUserId: number
  responseDate: string
  adminDescription?: string
  managementDescription?: string
  logisticsDescription?: string
  request?: RequestType
  responder?: User
}

export interface CreateRequestResponseDto {
  requestId: number
  responderUserId: number
  description?: string
}

export interface UpdateRequestResponseDto {
  requestId: number
  responderUserId: number
  description?: string
}

export interface CreateUserDto {
  name: string,
  lastName: string,
  email: string,
  password: string,
  userTypeId: number
}

export interface UpdateUserDto {
  name?: string,
  lastName?: string,
  email?: string,
  password?: string
}

export interface User {
  userId: number,
  name: string,
  lastName: string,
  email: string,
  phone?: string | null,
  password?: string,
  userType: string;
  deletedAt?: string | null,
}

export interface CreateUserTypeDto {
  name: string
}

export interface UserType {
  userTypeId: number,
  name: string
}

export interface Resource {
  resourceId: number;
  name: string;
  description: string;
  categoryResourceId: number;
  categoryResource?: CategoryResource;
  categoryName?: string;
  unit: string;
}

export interface CategoryResource {
  categoryResourceId: number;
  name: string;
  description: string;
  parentCategoryId?: number;
}

export interface Supplier {
  supplierId: number;
  name: string;
  contactName: string;
  phone: string;
  email?: string;
  address?: string;
  documentType: "ruc" | "dni";
  ruc?: string | null;
  dni?: string | null;
  accountNumber: string;
  bank: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  clientId: number;
  name: string;
  contactName: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  ruc: string;
  createdAt: string;
  updatedAt: string;
}

export type QuotationStatus = "draft" | "sent" | "approved" | "accepted";

export interface QuotationItem {
  quotationItemId?: number;
  quotationId?: number;
  orderNumber: number;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Quotation {
  quotationId: number;
  code: string;
  serviceDescription: string;
  clientId: number;
  status: QuotationStatus;
  commercialTerms?: string | null;
  costDirectAmount: number;
  igvRate: number;
  igvAmount: number;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  client?: Client;
  items?: QuotationItem[];
}

export interface PurchaseOrder {
  purchaseOrderId: number;
  code: string;
  codeComplete?: string; 
  deliveryLocation: string;
  destination: string;
  paymentConditions: string;
  generalConditions?: string;
  qualityConditions?: string;
  paymentMethod: string;
  saleAmount: number;
  purchaseAmount: number;
  status: string;
  carePerson: string;
  dniCarePerson: string;
  observations?: string;
  projectId: number;
  supplierId: number;
  quotation?: string;
  createdAt: string;
  purchaseOrderType: string;
  supplier?: Supplier;
  supplierName?: string;
  project?: Project;
  resources?: ResourcePurchaseOrder[];
}

export interface PurchaseOrderUnitValue {
  resourcePurchaseOrderId: number;
  purchaseOrderId: number;
  purchaseOrderCode: string;
  purchaseOrderType: "materials" | "services";
  description: string;
  supplierId: number;
  supplierName: string;
  currency?: string | null;
  unitPurchasePrice: number;
  orderNumber?: number;
}

export interface PettyCashType {
  pettyCashId: number;
  projectId: number;
  amount: number;
  description: string;
  invoiceNumber: string;
  expenseDate: string;
  expenseType: string;
  createdAt: string;
  updatedAt: Date;
}

export interface ServiceSaleType {
  serviceSaleId: number;
  projectId: number;
  serviceName: string;
  amount: number;
  description: string;
  createdAt: string;
  updatedAt: Date;
}

export type Currency = "PEN" | "USD" | "EUR";

export const WorkerType = {
  Laborer: ['laborer', 'Obrero'],
  Technician: ['technician', 'Técnico'],
  Engineer: ['engineer', 'Ingeniero'],
  Administrator: ['administrator', 'Administrador(a)'],
  Manager: ['manager', 'Gerente'],
  Unspecified: ['unspecified', 'No Especificado'],
} as const;

export type WorkerType = typeof WorkerType[keyof typeof WorkerType];

export interface Worker {
  workerId: number
  fullName: string
  dni: string
  phone?: string
  address?: string
  personalEmail?: string
  birthDate?: string
  workerType: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
  workerTypeName?: string
  dailyWage?: number
  attendances?: Attendance[];
}

export interface RequestWorker {
  requestWorkerId: number
  requestId: number
  shoeSize?: string | null
  pantsSize?: string | null
  shirtSize?: string | null
  workerId: number
  createdAt?: string
  updatedAt?: string
  worker?: Worker
  workerName?: string
  request?: RequestType
}

export interface WorkerInventoryAssignment {
  workerInventoryAssignmentId: number;
  workerId: number;
  workerName?: string | null;
  projectId: number;
  projectName?: string | null;
  projectCode?: string | null;
  elementId: number;
  elementName?: string | null;
  elementCode?: string | null;
  elementVariantId?: number | null;
  elementVariantLabel?: string | null;
  family?: string | null;
  familyLabel?: string | null;
  controlType?: string | null;
  categoryName?: string | null;
  inventoryAssetId?: number | null;
  assetCode?: string | null;
  serialNumber?: string | null;
  sourceProjectInventoryEntryId?: number | null;
  quantityAssigned: number;
  quantityReturned: number;
  quantityPending: number;
  status: string;
  assignedAt: string;
  returnedAt?: string | null;
  notes?: string | null;
}

export interface WorkerInventoryHistoryResponse {
  worker: {
    workerId: number;
    fullName: string;
    dni: string;
  };
  summary: {
    totalQuantity: number;
    activeQuantity: number;
    totalAssignments: number;
  };
  assignments: WorkerInventoryAssignment[];
}

export interface ElementRequestWorkerPlan {
  elementRequestWorkerPlanId?: number;
  elementRequestId: number;
  requestWorkerId: number;
  plannedQuantity: number;
  size?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
  requestWorker?: RequestWorker;
}

export interface ResourcePurchaseOrder {
  resourcePurchaseOrderId: number;
  purchaseOrderId: number;
  resourceId: number;
  orderNumber?: number;
  quantity: number;
  unitSalesPrice: number;
  unitPurchasePrice: number;
  totalPrice: number;
  createdAt: string;
  updatedAt?: string;
  resource?: Resource;
  purchaseOrder?: PurchaseOrder;
}

export interface Attendance {
  attendanceId: number;
  workerId: number;
  projectId: number;
  date: string;
  createdAt: string;
  updatedAt?: string;
}

export interface WorkersPayroll {
  workerId: number;
  workerName: string;
  workerType: string; // "laborer" | "technician"
  attendances: number;
  dailyWage: number;
}

export interface WeeklyPayrollData {
  weekId: number;
  startDate: string;
  endDate: string;
  laborerAmount: number;
  technicianAmount: number;
  totalAmount: number;
  workers: WorkersPayroll[];
}

export type MonthlyEvaluationQuestionType = "score" | "text";

export type MonthlyEvaluationStatus = "open" | "closed";

export interface MonthlyEvaluationQuestion {
  monthlyEvaluationQuestionId: number;
  prompt: string;
  questionType: MonthlyEvaluationQuestionType;
  isRequired: boolean;
  order?: number;
}

export interface MonthlyEvaluationSection {
  monthlyEvaluationSectionId: number;
  title: string;
  order?: number;
  questions: MonthlyEvaluationQuestion[];
}

export interface MonthlyEvaluationTemplateVersion {
  monthlyEvaluationTemplateVersionId: number;
  versionNumber?: number;
  title?: string;
  description?: string;
  observedMaxScore?: number;
  regularMaxScore?: number;
  sections: MonthlyEvaluationSection[];
}

export interface MonthlyEvaluationTemplate {
  monthlyEvaluationTemplateId: number;
  name: string;
  description?: string;
  observedMaxScore: number;
  regularMaxScore: number;
  isActive?: boolean;
  currentVersion?: MonthlyEvaluationTemplateVersion;
  versions?: MonthlyEvaluationTemplateVersion[];
  createdAt?: string;
  updatedAt?: string;
}

export interface MonthlyEvaluationResponse {
  monthlyEvaluationResponseId?: number;
  monthlyEvaluationQuestionId: number;
  score?: number;
  textAnswer?: string;
}

export interface MonthlyEvaluationPerformanceScaleItem {
  min: number;
  max: number;
  label: string;
}

export interface WorkerMonthlyEvaluation {
  workerMonthlyEvaluationId: number;
  workerId: number;
  monthlyEvaluationTemplateVersionId: number;
  year: number;
  month: number;
  sequence: number;
  generalComment?: string;
  status: MonthlyEvaluationStatus;
  totalScore?: number;
  maxScore?: number;
  performanceLabel?: string;
  responses: MonthlyEvaluationResponse[];
  templateVersion?: MonthlyEvaluationTemplateVersion;
  scoreLegend?: string[];
  performanceScale?: MonthlyEvaluationPerformanceScaleItem[];
  worker?: Worker;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateMonthlyEvaluationTemplateQuestionDto {
  prompt: string;
  questionType: MonthlyEvaluationQuestionType;
  isRequired: boolean;
}

export interface CreateMonthlyEvaluationTemplateSectionDto {
  title: string;
  questions: CreateMonthlyEvaluationTemplateQuestionDto[];
}

export interface CreateMonthlyEvaluationTemplateDto {
  name: string;
  description?: string;
  observedMaxScore: number;
  regularMaxScore: number;
  sections: CreateMonthlyEvaluationTemplateSectionDto[];
}

export interface CreateMonthlyEvaluationResponseDto {
  monthlyEvaluationQuestionId: number;
  score?: number;
  textAnswer?: string;
}

export interface CreateWorkerMonthlyEvaluationDto {
  workerId: number;
  monthlyEvaluationTemplateVersionId: number;
  year: number;
  month: number;
  sequence: number;
  generalComment?: string;
  responses: CreateMonthlyEvaluationResponseDto[];
}

export interface UpdateWorkerMonthlyEvaluationResponsesDto {
  generalComment?: string;
  responses: CreateMonthlyEvaluationResponseDto[];
}

export interface WorkerMonthlyEvaluationFilters {
  workerId?: number;
  month?: number;
  year?: number;
}

export interface WorkerMonthlyEvaluationPeriodFilters {
  month?: number;
  year?: number;
  sequence?: number;
}

export interface WorkerMonthlyEvaluationPeriod {
  year: number;
  month: number;
  sequence: number;
  status: MonthlyEvaluationStatus;
  totalWorkers: number;
  evaluatedWorkers: number;
  pendingWorkers: number;
  evaluationsCount: number;
  averageScore: number | null;
  highestScore: number | null;
  lowestScore: number | null;
  monthlyEvaluationTemplateVersionId: number | null;
  monthlyEvaluationTemplateId: number | null;
  templateName: string | null;
}

export interface WorkerMonthlyEvaluationPeriodKpis {
  averageScore: number | null;
  highestScore: number | null;
  lowestScore: number | null;
  totalWorkers: number;
  evaluatedWorkers: number;
  pendingWorkers: number;
}

export interface WorkerMonthlyEvaluationPeriodWorker {
  workerId: number;
  fullName: string;
  workerType: string;
  workerMonthlyEvaluationId: number | null;
  status: MonthlyEvaluationStatus | null;
  totalScore: number | null;
  maxScore: number | null;
  performanceLabel: string | null;
  evaluated: boolean;
}

export interface WorkerMonthlyEvaluationPeriodDetail {
  year: number;
  month: number;
  sequence: number;
  status: MonthlyEvaluationStatus;
  kpis: WorkerMonthlyEvaluationPeriodKpis;
  templateSuggestion: {
    monthlyEvaluationTemplateVersionId: number;
    monthlyEvaluationTemplateId: number;
    templateName: string;
  } | null;
  workers: WorkerMonthlyEvaluationPeriodWorker[];
}

export interface WorkerMonthlyEvaluationPeriodStatusPayload {
  year: number;
  month: number;
  sequence?: number;
}
