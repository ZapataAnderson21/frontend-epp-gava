interface User {
  user_id?: number;
  name: string;
  last_name: string;
  email: string;
  password?: string;
}

interface UserType {
  user_type_id?: number;
  name: string;
}

interface UserUserType {
  user_user_type_id?: number;
  user_id: number;
  user_type_id: number;
  user?: User;
  user_type?: UserType;
}

interface Element {
  element_id?: number;
  name: string;
  description: string;
}

interface Request {
  request_id?: number;
  user_id: number;
  date: string;
  status: string;
  user?: User;
}

interface ElementRequest{
  element_request_id?: number;
  unit: string;
  quantity: number;
  element_id: number;
  request_id?: number;
  element?: Element;
  request?: Request;
}

interface RequestRejected {
  request_rejected_id?: number;
  rejection_date: string;
  description?: string;
  request_id: number;
}

interface RequestAccepted {
  request_accepted_id?: number;
  acceptance_date: string;
  description?: string;
  request_id: number;
  request?: Request;
}

interface ElementRequestAccepted {
  element_request_accepted_id?: number;
  quantity: number;
  unit: string;
  element_id: number;
  request_accepted_id: number;
  element?: Element;
  request_accepted?: RequestAccepted;
}

export type {
  User,
  UserType,
  UserUserType,
  Element,
  Request,
  ElementRequest,
  RequestRejected,
  RequestAccepted,
  ElementRequestAccepted,
};