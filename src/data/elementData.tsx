import { root } from "./root";

const elementRoot = `${root}/element`;

const elementData = {
    create : `${elementRoot}/`,
    update : `${elementRoot}/:id`,
    getOne : `${elementRoot}/:id`,
    getAll : `${elementRoot}/`,
    getByType: `${elementRoot}/type/:type`
}

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

export interface ElementGetAllResponse {
  statusCode: number;
  message: string;
  data: ElementType[];
}

export interface ElementResponse {
  statusCode: number;
  message: string;
  data: ElementType;
}

export async function fetchCreateElement(data: CreateElementDto): Promise<ElementResponse> {
  try {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      throw new Error("No token found in localStorage");
    }

    const headers = new Headers({
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    });

    const response = await fetch(elementData.create, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(data),
    });

    const result = await response.json() as ElementResponse;

    if( !response.ok) {
      throw new Error(`Error creating element: ${result.message}`);
    }

    return result;
  } catch (error) {
    console.error("Error in fetchCreateElement:", error);
    throw error;
  }
}


export async function fetchGetAllElements(): Promise<ElementGetAllResponse> {

  try {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      throw new Error("No token found in localStorage");
    }

    const headers = new Headers({
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    });

    const response = await fetch(elementData.getAll, {
      method: "GET",
      headers: headers,
    });

    const result = await response.json() as ElementGetAllResponse;

    if (!response.ok) {
      throw new Error(`Error fetching elements: ${result.message}`);
    }

    return result;
  } catch (error) {
    console.error("Error in fetchGetAllElements:", error);
    throw error;
  }
}


export async function fetchGetByType(type: string): Promise<ElementGetAllResponse> {
  try {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      throw new Error("No token found in localStorage");
    }

    const headers = new Headers({
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    });

    const response = await fetch(elementData.getByType.replace(":type", type), {
      method: "GET",
      headers: headers,
    });

    const result = await response.json() as ElementGetAllResponse;

    if (!response.ok) {
      throw new Error(`Error fetching elements by type: ${result.message}`);
    }

    return result;
  } catch (error) {
    console.error("Error in fetchGetByType:", error);
    throw error;
  }
}


export async function fetchGetOne(elementId: number): Promise<ElementResponse> {
  try {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      throw new Error("No token found in localStorage");
    }

    const headers = new Headers({
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    });

    const response = await fetch(elementData.getOne.replace(":id", elementId.toString()), {
      method: "GET",
      headers: headers,
    });

    const result = await response.json() as ElementResponse;

    if (!response.ok) {
      throw new Error(`Error fetching element: ${result.message}`);
    }

    return result;
  } catch (error) {
    console.error("Error in fetchGetOne:", error);
    throw error;
  }
}


export async function fetchUpdateElement(elementId:number, data: UpdateElementDto): Promise<ElementResponse> {
  try {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      throw new Error("No token found in localStorage");
    }

    const headers = new Headers({
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    });

    const response = await fetch(elementData.update.replace(":id", elementId.toString()), {
      method: "PATCH",
      headers: headers,
      body: JSON.stringify(data),
    });

    const result = await response.json() as ElementResponse;

    if (!response.ok) {
      throw new Error(`Error updating element: ${result.message}`);
    }

    return result;
  } catch (error) {
    console.error("Error in fetchUpdateElement:", error);
    throw error;
  }
}