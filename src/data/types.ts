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
  description: string
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
  description?: string
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
  email: string;
  address?: string;
  ruc: string;
  accountNumber: string;
  bank: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrder {
  purchaseOrderId: number;
  code: string;
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
}

export interface PettyCashType {
  pettyCashId: number;
  projectId: number;
  resourceName: string;
  amount: number;
  description: string;
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

export interface Worker {
  workerId: number
  fullName: string
  dni: string
  phone?: string
  address?: string
  personalEmail?: string
  birthDate?: string
  workerGroupId: number
  createdAt: string
  updatedAt: string
  deletedAt?: string
  workerGroup?: WorkerGroup
  workerGroupName?: string
}

export interface WorkerGroup {
  workerGroupId: number
  name: string
  description?: string
  parentGroupId?: number
  createdAt: string
  updatedAt: string
  parentGroup?: WorkerGroup
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
  quantity: number;
  unitSalesPrice: number;
  unitPurchasePrice: number;
  totalPrice: number;
  createdAt: string;
  updatedAt?: string;
  resource?: Resource;
  purchaseOrder?: PurchaseOrder;
}