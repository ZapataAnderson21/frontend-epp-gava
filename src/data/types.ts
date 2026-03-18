export interface ElementType {
  elementId: number;
  name: string;
  type: string;
  description: string;
}

export interface CreateElementDto {
  name: string;
  type: string;
  description: string;
}

export interface UpdateElementDto {
  name: string;
  type: string;
  description: string;
}

export interface ElementRequestType {
  elementRequestId?: number
  quantityRequested: number
  unit: string
  elementId: number
  requestId: number
  element?: ElementType
  elementRequestResponses?: ElementRequestResponseType[]
}

export interface CreateElementRequestDto {
  quantityRequested: number
  unit: string
  elementId: number
  requestId: number
}

export interface UpdateElementRequestDto {
  elementRequestId?: number
  quantityRequested: number
  unit: string
  elementId: number
  requestId: number
}

export interface ElementRequestResponseType {
  elementRequestResponseId: number
  elementRequestId: number
  quantityAccepted: number
  requestResponseId: number
  elementRequest?: ElementRequestType
  requestResponse?: RequestResponseType
}

export interface CreateElementRequestResponseDto {
  elementRequestId: number
  quantityAccepted: number
  requestResponseId: number
}

export interface UpdateElementRequestResponseDto {
  elementRequestId?: number
  quantityAccepted: number
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
  user?: User
  project?: Project
  elementRequests?: ElementRequestType[]
  userName?: string
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
  password?: string,
  userType: string;
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