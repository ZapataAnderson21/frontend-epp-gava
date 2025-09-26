import { root } from "./apiUrl";

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

export async function fetchCreateElement(data: CreateElementDto) {
  const token = localStorage.getItem("accessToken");

  if (!token) {
    throw new Error("No token found in localStorage");
  }

  const headers = new Headers({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  });

  return await fetch(elementData.create, {
    method: "POST",
    headers: headers,
    body: JSON.stringify(data),
  });
}


export async function fetchGetAllElements() {
  const token = localStorage.getItem("accessToken");

  if (!token) {
    throw new Error("No token found in localStorage");
  }

  const headers = new Headers({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  });

  return await fetch(elementData.getAll, {
    method: "GET",
    headers: headers,
  });
}


export async function fetchGetByType(type: string) {
  const token = localStorage.getItem("accessToken");

  if (!token) {
    throw new Error("No token found in localStorage");
  }

  const headers = new Headers({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  });

  return await fetch(elementData.getByType.replace(":type", type), {
    method: "GET",
    headers: headers,
  });
}


export async function fetchGetOne(elementId: number) {
  
  const token = localStorage.getItem("accessToken");

  if (!token) {
    throw new Error("No token found in localStorage");
  }

  const headers = new Headers({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  });

  return await fetch(elementData.getOne.replace(":id", elementId.toString()), {
    method: "GET",
    headers: headers,
  });
}


export async function fetchUpdateElement(elementId:number, data: UpdateElementDto) {
  
    const token = localStorage.getItem("accessToken");

    if (!token) {
      throw new Error("No token found in localStorage");
    }

    const headers = new Headers({
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    });

    return await fetch(elementData.update.replace(":id", elementId.toString()), {
      method: "PATCH",
      headers: headers,
      body: JSON.stringify(data),
    });
}