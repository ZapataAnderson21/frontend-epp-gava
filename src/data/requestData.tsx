import type { UserType } from '../Types'
import type { ProjectType } from './projectData'
import { root } from './root'

const requestRoot = `${root}/request`

const requestData = {
  create: `${requestRoot}/`,
  getAll: `${requestRoot}/`,
  getOne: `${requestRoot}/:id`,
  update: `${requestRoot}/:id`,
  delete: `${requestRoot}/:id`,
  getByProject: `${requestRoot}/project/:projectId`,
  getByUser: `${requestRoot}/user/:userId`,
  getByStatus: `${requestRoot}/status/:status`,
  updateStatus: `${requestRoot}/:id/status`,
  sendToLogistics: `${requestRoot}/send-to-logistics`,
  getPdf: `${requestRoot}/pdf/:id`,
}

export interface RequestType {
  request_id: number
  registration_date: string
  status: string
  description: string
  project_id: number
  user_id: number
  type: string
  user?: UserType
  project?: ProjectType
}

export interface CreateRequestDto {
  description?: string
  project_id: number
  user_id: number
  type: string
}

export interface UpdateRequestDto {
  registration_date?: string
  status?: string
  description?: string
  project_id?: number
  user_id?: number
  type?: string
}

export interface RequestGetAllResponse {
  statusCode: number
  message: string
  data: RequestType[]
}

export interface RequestResponse {
  statusCode: number
  message: string
  data: RequestType
}

export async function fetchCreateRequest(data: CreateRequestDto): Promise<RequestResponse> {
  try {
    const token = localStorage.getItem('accessToken')

    if (!token) {
      throw new Error('Iniciar sesión.')
    }

    const response = await fetch(requestData.create, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error('Error al crear la solicitud.')
    }

    return await response.json()
  } catch (error) {
    throw error
  }
}

export async function fetchGetAllRequests(): Promise<RequestGetAllResponse> {
  try {
    const token = localStorage.getItem('accessToken')

    if (!token) {
      throw new Error('Iniciar sesión.')
    }

    const response = await fetch(requestData.getAll, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error('Error al obtener las solicitudes.')
    }

    return await response.json()
  } catch (error) {
    throw error
  }
}

export async function fetchGetRequestById(id: number): Promise<RequestResponse> {
  try {
    const token = localStorage.getItem('accessToken')

    if (!token) {
      throw new Error('Iniciar sesión.')
    }

    const response = await fetch(requestData.getOne.replace(':id', id.toString()), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error('Error al obtener la solicitud.')
    }

    return await response.json()
  } catch (error) {
    throw error
  }
}

export async function fetchUpdateRequest(id: number, data: UpdateRequestDto): Promise<RequestResponse> {
  try {
    const token = localStorage.getItem('accessToken')

    if (!token) {
      throw new Error('Iniciar sesión.')
    }

    const response = await fetch(requestData.update.replace(':id', id.toString()), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error('Error al actualizar la solicitud.')
    }

    return await response.json()
  } catch (error) {
    throw error
  }
}

export async function fetchDeleteRequest(id: number): Promise<RequestResponse> {
  try {
    const token = localStorage.getItem('accessToken')

    if (!token) {
      throw new Error('Iniciar sesión.')
    }

    const response = await fetch(requestData.delete.replace(':id', id.toString()), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error('Error al eliminar la solicitud.')
    }

    return await response.json()
  } catch (error) {
    throw error
  }
}

export async function fetchGetRequestsByProject(projectId: number): Promise<RequestGetAllResponse> {
  try {
    const token = localStorage.getItem('accessToken')

    if (!token) {
      throw new Error('Iniciar sesión.')
    }

    const response = await fetch(requestData.getByProject.replace(':projectId', projectId.toString()), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error('Error al obtener las solicitudes por proyecto.')
    }

    return await response.json()
  } catch (error) {
    throw error
  }
}

export async function fetchGetRequestsByUser(userId: number): Promise<RequestGetAllResponse> {
  try {
    const token = localStorage.getItem('accessToken')

    if (!token) {
      throw new Error('Iniciar sesión.')
    }

    const response = await fetch(requestData.getByUser.replace(':userId', userId.toString()), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error('Error al obtener las solicitudes por usuario.')
    }

    return await response.json()
  } catch (error) {
    throw error
  }
}

export async function fetchGetRequestsByStatus(status: string): Promise<RequestGetAllResponse> {
  try {
    const token = localStorage.getItem('accessToken')

    if (!token) {
      throw new Error('Iniciar sesión.')
    }

    const response = await fetch(requestData.getByStatus.replace(':status', status), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error('Error al obtener las solicitudes por estado.')
    }

    return await response.json()
  } catch (error) {
    throw error
  }
}

export async function fetchUpdateRequestStatus(id: number, status: string): Promise<RequestResponse> {
  try {
    const token = localStorage.getItem('accessToken')

    if (!token) {
      throw new Error('Iniciar sesión.')
    }

    const response = await fetch(requestData.updateStatus.replace(':id', id.toString()), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    })

    if (!response.ok) {
      throw new Error('Error al actualizar el estado de la solicitud.')
    }

    return await response.json()
  } catch (error) {
    throw error
  }
}

export async function fetchSendRequestToLogistics(requestId: number, passwordCPanel: string): Promise<RequestResponse> {
  try {
    const token = localStorage.getItem('accessToken')

    if (!token) {
      throw new Error('Iniciar sesión.')
    }

    const response = await fetch(requestData.sendToLogistics, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ request_id: requestId, passwordCPanel }),
    })

    if (!response.ok) {
      throw new Error('Error al enviar la solicitud a logística.')
    }

    return await response.json()
  } catch (error) {
    throw error
  }
}