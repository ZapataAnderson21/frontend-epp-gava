import { root } from "./root";

const projectRoot = `${root}/project`;

const projectData = {
  create : `${projectRoot}/`,
  update : `${projectRoot}/:id`,
  getOne : `${projectRoot}/:id`,
  getAll : `${projectRoot}/`,
  getByCode: `${projectRoot}/code/:code`,
  getByStatus: `${projectRoot}/status/:status`,
  updateStatus: `${projectRoot}/:id/status`
};

export interface ProjectType {
  project_id: number;
  name: string;
  description: string;
  code: string;
  status: string;
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

const user = JSON.parse(localStorage.getItem("user") || "{}");

export async function fetchCreateProject(data: CreateProjectDto) {
  const token = localStorage.getItem("accessToken");

  if(!user) {
    throw new Error("Iniciar sesión.");
  }

  if (!token) {
    throw new Error("No token found in localStorage");
  }

  const headers = new Headers({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  });

 return await fetch(projectData.create, {
    method: "POST",
    headers: headers,
    body: JSON.stringify(data),
  });
}


export async function fetchGetAllProjects() {
  const token = localStorage.getItem("accessToken");

  if (!token) {
    throw new Error("No token found in localStorage");
  }

  const headers = new Headers({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  });

  return await fetch(projectData.getAll, {
    method: "GET",
    headers: headers,
  });
}

export async function fetchGetByStatus(status: string) {
  const token = localStorage.getItem("accessToken");

  if (!token) {
    throw new Error("No token found in localStorage");
  }

  const headers = new Headers({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  });

  return await fetch(projectData.getByStatus.replace(":status", status), {
    method: "GET",
    headers: headers,
  });
}


export async function fetchGetOne(projectId: number): Promise<ProjectType> {
  const token = localStorage.getItem("accessToken");

  if (!token) {
    throw new Error("No token found in localStorage");
  }

  const headers = new Headers({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  });

  const response = await fetch(projectData.getOne.replace(":id", projectId.toString()), {
    method: "GET",
    headers: headers,
  });

  const result = await response.json() as ProjectType;

  if (!response) {
    throw new Error(`Error fetching project`);
  }

  return result;
}


export async function fetchUpdateProject(projectId:number, data: UpdateProjectDto) {
  const token = localStorage.getItem("accessToken");

  if (!token) {
    throw new Error("No token found in localStorage");
  }

  if(!user) {
    throw new Error("Iniciar sesión.");
  }

  const headers = new Headers({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  });

  return await fetch(projectData.update.replace(":id", projectId.toString()), {
    method: "PATCH",
    headers: headers,
    body: JSON.stringify(data),
  });
}

export async function fetchUpdateStatus(projectId: number, status: string): Promise<ProjectType> {
  try {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      throw new Error("No token found in localStorage");
    }

    if(!user) {
      throw new Error("Iniciar sesión.");
    }

    const userType = user.userType;

    const authorizedTypes = ["GERENTE", "ADMINISTRADORA", "SISTEMAS"];

    if (!authorizedTypes.includes(userType)) {
      throw new Error("No tienes permisos para crear un proyecto.");
    }

    const headers = new Headers({
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    });

    const response = await fetch(projectData.updateStatus.replace(":id", projectId.toString()), {
      method: "PATCH",
      headers: headers,
      body: JSON.stringify({ status }),
    });

    const result = await response.json() as ProjectType;

    if (!response.ok) {
      throw new Error(`Error updating project status`);
    }

    return result;
  } catch (error) {
    console.error("Error in fetchUpdateStatus:", error);
    throw error;
  }
}