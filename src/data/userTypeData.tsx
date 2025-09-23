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

export interface UserType {
  user_type_id: number,
  name: string,
}

export async function fetchCreateUserType(data: CreateUserTypeDto) {

  const token = localStorage.getItem("accessToken");

  if (!token) {
    throw new Error("No token found in localStorage");
  }

  const headers = new Headers({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  });

  return await fetch(userTypeData.create, {
    method: "POST",
    headers: headers,
    body: JSON.stringify(data),
  });
}


export async function fetchGetAllUserTypes() {

  const token = localStorage.getItem("accessToken");

  if (!token) {
    throw new Error("No token found in localStorage");
  }

  const headers = new Headers({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  });

  return await fetch(userTypeData.getAll, {
    method: "GET",
    headers: headers,
  });
}


export async function fetchGetOneUserType(userTypeId: number) {

  const token = localStorage.getItem("accessToken");

  if (!token) {
    throw new Error("No token found in localStorage");
  }

  const headers = new Headers({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  });

  return await fetch(userTypeData.getOne.replace(":id", userTypeId.toString()), {
    method: "GET",
    headers: headers,
  });
}