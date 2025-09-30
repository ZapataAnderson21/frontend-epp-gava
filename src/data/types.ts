export interface ElementType {
  element_id: number;
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
  element_request_id?: number
  quantity_requested: number
  unit: string
  element_id: number
  request_id: number
  element?: ElementType
  elementRequestResponses?: ElementRequestResponseType[]
}

export interface CreateElementRequestDto {
  quantity_requested: number
  unit: string
  element_id: number
  request_id: number
}

export interface UpdateElementRequestDto {
  element_request_id?: number
  quantity_requested: number
  unit: string
  element_id: number
  request_id: number
}

export interface ElementRequestResponseType {
  element_request_response_id: number
  element_request_id: number
  quantity_accepted: number
  request_response_id: number
  elementRequest?: ElementRequestType
  requestResponse?: RequestResponseType
}

export interface CreateElementRequestResponseDto {
  element_request_id: number
  quantity_accepted: number
  request_response_id: number
}

export interface UpdateElementRequestResponseDto {
  element_request_id?: number
  quantity_accepted: number
  request_response_id: number
}

export interface EmergencyType {
  emergency_id: number;
  image: string; 
  title: string; 
  description: string;
  user_id: number;
  project_id: number;
  createdAt: string;
  status: string;
  user?: User;
  project?: ProjectType;
}

export interface CreateEmergencyDto {
  image: string; 
  title: string; 
  description: string;
  user_id: number;
  project_id: number;
}

export interface UpdateEmergencyDto {
  image?: string; 
  title?: string; 
  description?: string;
  user_id?: number;
  project_id?: number;
  createdAt?: string;
  status?: string;
}

export interface ProjectType {
  project_id: number;
  name: string;
  description: string;
  code: string;
  status: string;
  createdAt: string;
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
  request_id: number
  createdAt: string
  delivery_due_date: string
  status: string
  description: string
  project_id: number
  user_id: number
  type: string
  user?: User
  project?: ProjectType
  elementRequests?: ElementRequestType[]
}

export interface CreateRequestDto {
  delivery_due_date: string
  description?: string
  project_id: number
  user_id: number
  type: string
}

export interface UpdateRequestDto {
  createdAt?: string
  status?: string
  delivery_due_date?: string
  description?: string
  project_id?: number
  user_id?: number
  type?: string
}

export interface RequestResponseType {
  request_response_id: number
  request_id: number
  responder_user_id: number
  response_date: string
  description?: string
  request?: RequestType
  responder?: User
}

export interface CreateRequestResponseDto {
  request_id: number
  responder_user_id: number
  description?: string
}

export interface UpdateRequestResponseDto {
  request_id: number
  responder_user_id: number
  description?: string
}

export interface CreateUserDto {
  name: string,
  last_name: string,
  email: string,
  password: string,
  user_type_id: number
}

export interface UpdateUserDto {
  name?: string,
  last_name?: string,
  email?: string,
  password?: string
}

export interface User {
  user_id: number,
  name: string,
  last_name: string,
  email: string,
  password?: string,
  userType: string;
}

export interface CreateUserTypeDto {
  name: string
}

export interface UserType {
  user_type_id: number,
  name: string,
}