export const getFetch = async (url: string) => {
  
  const token = localStorage.getItem("accessToken");

  if (!token) {
    throw new Error("No token found in localStorage");
  }

  const headers = new Headers({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  });

  const controller = new AbortController();

  const response = await fetch(url, {
    method: "GET",
    headers,
    signal: controller.signal,
  });

  return response.json();
}

export const postFetch = async (url: string, data: any) => {

  const token = localStorage.getItem("accessToken");

  if (!token) {
    throw new Error("No token found in localStorage");
  }

  const headers = new Headers({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  });

  const controller = new AbortController();

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
    signal: controller.signal,
  });

  return response.json();
}

export const patchFetch = async (url: string, data: any) => {
  const token = localStorage.getItem("accessToken");

  if (!token) {
    throw new Error("No token found in localStorage");
  }

  const headers = new Headers({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  });

  const controller = new AbortController();

  const response = await fetch(url, {
    method: "PATCH",
    headers,
    body: JSON.stringify(data),
    signal: controller.signal,
  });

  return response.json();
}

export const deleteFetch = async (url: string) => {

  const token = localStorage.getItem("accessToken");

  if (!token) {
    throw new Error("No token found in localStorage");
  }

  const headers = new Headers({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  });

  const controller = new AbortController();

  const response = await fetch(url, {
    method: "DELETE",
    headers,
    signal: controller.signal,
  });

  return response.json();
}
