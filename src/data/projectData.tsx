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

export interface ProjectGetAllResponse {
  statusCode: number;
  message: string;
  data: ProjectType[];
}

export interface ProjectResponse {
  statusCode: number;
  message: string;
  data: ProjectType;
}

const user = JSON.parse(localStorage.getItem("user") || "{}");

export async function fetchCreateProject(data: CreateProjectDto): Promise<ProjectResponse> {
  try {
    const token = localStorage.getItem("accessToken");

    if(!user) {
      throw new Error("Iniciar sesión.");
    }

    const userType = user.userUserTypes[0].userType.name;

    if (userType !== "GERENTE" && userType !== "ADMINISTRADORA" && userType !== "SISTEMAS") {
      throw new Error("No tienes permisos para crear un proyecto.");
    }

    if (!token) {
      throw new Error("No token found in localStorage");
    }

    const headers = new Headers({
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    });

    const response = await fetch(projectData.create, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(data),
    });

    const result = await response.json() as ProjectResponse;

    if( !response.ok) {
      throw new Error(`Error creating project: ${result.message}`);
    }

    return result;
  } catch (error) {
    console.error("Error in fetchCreateProject:", error);
    throw error;
  }
}


export async function fetchGetAllProjects(): Promise<ProjectGetAllResponse> {

  try {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      throw new Error("No token found in localStorage");
    }

    const headers = new Headers({
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    });

    const response = await fetch(projectData.getAll, {
      method: "GET",
      headers: headers,
    });

    const result = await response.json() as ProjectGetAllResponse;

    if (!response.ok) {
      throw new Error(`Error fetching projects: ${result.message}`);
    }

    return result;
  } catch (error) {
    console.error("Error in fetchGetAllProjects:", error);
    throw error;
  }
}


export async function fetchGetByStatus(status: string): Promise<ProjectGetAllResponse> {
  try {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      throw new Error("No token found in localStorage");
    }

    const headers = new Headers({
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    });

    const response = await fetch(projectData.getByStatus.replace(":status", status), {
      method: "GET",
      headers: headers,
    });

    const result = await response.json() as ProjectGetAllResponse;

    if (!response.ok) {
      throw new Error(`Error fetching projects by status: ${result.message}`);
    }

    return result;
  } catch (error) {
    console.error("Error in fetchGetByStatus:", error);
    throw error;
  }
}


export async function fetchGetOne(projectId: number): Promise<ProjectResponse> {
  try {
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

    const result = await response.json() as ProjectResponse;

    if (!response.ok) {
      throw new Error(`Error fetching project: ${result.message}`);
    }

    return result;
  } catch (error) {
    console.error("Error in fetchGetOne:", error);
    throw error;
  }
}


export async function fetchUpdateProject(projectId:number, data: UpdateProjectDto): Promise<ProjectResponse> {
  try {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      throw new Error("No token found in localStorage");
    }

    const headers = new Headers({
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    });

    const response = await fetch(projectData.update.replace(":id", projectId.toString()), {
      method: "PATCH",
      headers: headers,
      body: JSON.stringify(data),
    });

    const result = await response.json() as ProjectResponse;

    if (!response.ok) {
      throw new Error(`Error updating project: ${result.message}`);
    }

    return result;
  } catch (error) {
    console.error("Error in fetchUpdateProject:", error);
    throw error;
  }
}

export async function fetchUpdateStatus(projectId: number, status: string): Promise<ProjectResponse> {
  try {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      throw new Error("No token found in localStorage");
    }

    if(!user) {
      throw new Error("Iniciar sesión.");
    }

    const userType = user.userUserTypes[0].userType.name;

    if (userType !== "GERENTE" && userType !== "ADMINISTRADORA" && userType !== "SISTEMAS") {
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

    const result = await response.json() as ProjectResponse;

    if (!response.ok) {
      throw new Error(`Error updating project status: ${result.message}`);
    }

    return result;
  } catch (error) {
    console.error("Error in fetchUpdateStatus:", error);
    throw error;
  }
}