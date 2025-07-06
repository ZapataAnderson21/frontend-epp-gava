import type { RequestType } from './requestData'
import { root } from './root'
import type { UserResponse } from './userData'

const requestRoot = `${root}/request-response`

const requestData = {
  create: `${requestRoot}/`,
  getAll: `${requestRoot}/`,
  getOne: `${requestRoot}/:id`,
  getByRequestId: `${requestRoot}/request/:requestId`,
  update: `${requestRoot}/:id`,
}

export interface RequestResponseType {
  request_response_id: number
  request_id: number
  responder_user_id: number
  response_date: string
  description?: string
  request?: RequestType
  responder?: UserResponse
}

export interface CreateRequestResponseDto {
  request_id: number
  responder_user_id: number
  description?: string
}

export interface UpdateRequestResponseDto {
  request_id: number
  responder_user_id: number
  response_date: string
  description?: string
}

export interface RequestResponseGetAllResponse {
  statusCode: number
  message: string
  data: RequestType[]
}

export interface RequestResponseResponse {
  statusCode: number
  message: string
  data: RequestResponseType
}

export async function fetchCreateRequestResponse(data: CreateRequestResponseDto): Promise<RequestResponseResponse> {
  try {
    console.log('Creating request response with data:', data)
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
      throw new Error('Error al crear la respuesta de la solicitud.')
    }

    console.log('Response from server:', response)

    return await response.json()
  } catch (error) {
    throw error
  }
}

export async function fetchGetAllRequests(): Promise<RequestResponseGetAllResponse> {
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

export async function fetchGetRequestResponseById(id: number): Promise<RequestResponseResponse> {
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

export async function fetchUpdateRequest(id: number, data: UpdateRequestResponseDto): Promise<RequestResponseResponse> {
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

export async function fetchGetRequestResponseByRequestId(requestId: number): Promise<RequestResponseGetAllResponse> {
  try {
    const token = localStorage.getItem('accessToken')

    if (!token) {
      throw new Error('Iniciar sesión.')
    }

    const response = await fetch(requestData.getByRequestId.replace(':requestId', requestId.toString()), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error('Error al obtener las respuestas de la solicitud.')
    }

    return await response.json()
  } catch (error) {
    throw error
  }
}

