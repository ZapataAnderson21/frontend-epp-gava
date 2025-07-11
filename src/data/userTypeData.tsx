import { root } from "./root";

const userTypeRoot = `${root}/user-type`;

const userTypeData = {
  create : `${userTypeRoot}/`,
  getOne : `${userTypeRoot}/:id`,
  getAll : `${userTypeRoot}/`,
};

export interface CreateUserTypeDto {
  name: string
}

export interface UserTypeResponse {
  user_type_id: number,
  name: string,
}

export interface ApiResponseGetAllUserTypes {
  statusCode: number;
  message: string;
  data: UserTypeResponse[];
}

export interface ApiResponseGetOneUserType {
  statusCode: number;
  message: string;
  data: UserTypeResponse;
}

export async function fetchCreateUserType(data: CreateUserTypeDto): Promise<ApiResponseGetOneUserType> {
  try {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      throw new Error("No token found in localStorage");
    }

    const headers = new Headers({
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    });

    const response = await fetch(userTypeData.create, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(data),
    });

    const result = await response.json() as ApiResponseGetOneUserType;

    if( !response.ok) {
      throw new Error(`Error creating userType: ${result.message}`);
    }

    return result;
  } catch (error) {
    console.error("Error in fetchCreateUserType:", error);
    throw error;
  }
}


export async function fetchGetAllUserTypes(): Promise<ApiResponseGetAllUserTypes> {

  try {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      throw new Error("No token found in localStorage");
    }

    const headers = new Headers({
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    });

    const response = await fetch(userTypeData.getAll, {
      method: "GET",
      headers: headers,
    });

    const result = await response.json() as ApiResponseGetAllUserTypes;

    if (!response.ok) {
      throw new Error(`Error fetching userTypes: ${result.message}`);
    }

    return result;
  } catch (error) {
    console.error("Error in fetchGetAllUserTypes:", error);
    throw error;
  }
}


export async function fetchGetOneUserType(userTypeId: number): Promise<ApiResponseGetOneUserType> {
  try {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      throw new Error("No token found in localStorage");
    }

    const headers = new Headers({
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    });

    const response = await fetch(userTypeData.getOne.replace(":id", userTypeId.toString()), {
      method: "GET",
      headers: headers,
    });

    const result = await response.json() as ApiResponseGetOneUserType;

    if (!response.ok) {
      throw new Error(`Error fetching userType: ${result.message}`);
    }

    return result;
  } catch (error) {
    console.error("Error in fetchGetOne:", error);
    throw error;
  }
}