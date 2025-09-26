import type { ProjectType } from "./projectData";
import { root } from "./apiUrl";
import type { UserResponse } from "./userData";

const emergencyRoot = `${root}/emergency`;

const emergencyData = {
  create : `${emergencyRoot}/`,
  update : `${emergencyRoot}/:id`,
  getOne : `${emergencyRoot}/:id`,
  getAll : `${emergencyRoot}/`,
  getByProjectId: `${emergencyRoot}/project/:id`,
  getByUserId: `${emergencyRoot}/user/:id`,
  getByStatus: `${emergencyRoot}/status/:status`,
};

export interface EmergencyType {
  emergency_id: number;
  image: string; 
  title: string; 
  description: string;
  user_id: number;
  project_id: number;
  createdAt: string;
  status: string;
  user?: UserResponse;
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

export interface EmergencyGetAllResponse {
  statusCode: number;
  message: string;
  data: EmergencyType[];
}

export interface EmergencyResponse {
  statusCode: number;
  message: string;
  data: EmergencyType;
}


export async function fetchCreateEmergencyWithImage(formData: FormData): Promise<EmergencyResponse> {
  try {
    const token = localStorage.getItem("accessToken");

    const response = await fetch(emergencyData.create, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to create emergency");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating emergency:", error);
    throw error;
  }
}


export async function fetchGetAllEmergencies(): Promise<EmergencyGetAllResponse> {
  try {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      throw new Error("No token found in localStorage");
    }

    const response = await fetch(emergencyData.getAll, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error("Failed to fetch emergencies");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching all emergencies:", error);
    throw error;
  }
}

export async function fetchGetEmergencyById(id: number): Promise<EmergencyResponse> {
  try {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      throw new Error("No token found in localStorage");
    }

    const response = await fetch(emergencyData.getOne.replace(":id", id.toString()), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error("Failed to fetch emergency by ID");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching emergency by ID:", error);
    throw error;
  }
}

export async function fetchUpdateEmergency(id: number, dto: UpdateEmergencyDto): Promise<EmergencyResponse> {
  try {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      throw new Error("No token found in localStorage");
    }

    const response = await fetch(emergencyData.update.replace(":id", id.toString()), {
      method: "PATCH",
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dto)
    });

    if (!response.ok) {
      throw new Error("Failed to update emergency");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating emergency:", error);
    throw error;
  }
}


export async function fetchGetEmergenciesByProjectId(project_id: number): Promise<EmergencyGetAllResponse> {
  try{
    const token = localStorage.getItem("accessToken");


    if (!token) {
      throw new Error("No token found in localStorage");
    }

    const response = await fetch(emergencyData.getByProjectId.replace(":id", project_id.toString()), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error("Failed to fetch emergencies by project ID");
    }

    return await response.json(); 
  } catch (error) {
    console.error("Error getting emergencies:", error);
    throw error;
  }
}


export async function fetchGetEmergenciesByUserId(user_id: number): Promise<EmergencyGetAllResponse> {
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      throw new Error("No token found in localStorage");
    }

    const response = await fetch(emergencyData.getByUserId.replace(":id", user_id.toString()), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error("Failed to fetch emergencies by user ID");
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching emergencies by user ID:", error);
    throw error;
  }
}


export async function fetchGetEmergenciesByStatus(status: string): Promise<EmergencyGetAllResponse> {
  try {
    const token = localStorage.getItem("accessToken");
    
    if (!token) {
      throw new Error("No token found in localStorage");
    }

    const response = await fetch(emergencyData.getByStatus.replace(":status", status), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error("Failed to fetch emergencies by status");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching emergencies by status:", error);
    throw error;
  }
}