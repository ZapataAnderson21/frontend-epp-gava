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
  project?: ProjectType;
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

export interface ProjectType {
  projectId: number;
  name: string;
  description: string;
  code: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  status: string;
  createdAt: string;
  purchaseOrders?: PurchaseOrderType[];
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
  project?: ProjectType
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

export interface PurchaseOrderType {
  purchaseOrderId: number;
  code: string;
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
  purchaseOrderType: PurchaseOrderType;
}